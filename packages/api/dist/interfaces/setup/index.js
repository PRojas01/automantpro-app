import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { applySchema, getSchemaStatus, missingDbEnv, openConnection, } from "../../infrastructure/schema-setup/apply.js";
import { MysqlAdminStore } from "../../infrastructure/admin/admin-store.js";
import { hashPassword } from "../../infrastructure/password.js";
import { generateTotpSecret, otpauthUri } from "../../application/admin/security.js";
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const adminInput = z.object({
    email: z.string().trim().toLowerCase().email().max(191),
    name: z.string().trim().min(3).max(60),
    password: z.string().min(12).max(200),
});
function digest(value) {
    return createHash("sha256").update(value).digest();
}
export function tokenMatches(provided, expected) {
    if (typeof provided !== "string" || provided.length === 0)
        return false;
    return timingSafeEqual(digest(provided), digest(expected));
}
export async function setupRoutes(app, options = {}) {
    const env = options.env ?? process.env;
    const connect = options.connect ?? (() => openConnection(env));
    const adminStore = options.adminStore ?? new MysqlAdminStore(connect);
    const failures = new Map();
    let running = false;
    function notFound(request, reply) {
        return reply
            .code(404)
            .send({ message: `Route ${request.method}:${request.url} not found`, error: "Not Found", statusCode: 404 });
    }
    app.addHook("onRequest", async (request, reply) => {
        reply.header("Cache-Control", "no-store");
        const expected = env.SETUP_TOKEN?.trim();
        if (!expected || expected.length < 32)
            return notFound(request, reply);
        const now = Date.now();
        const record = failures.get(request.ip);
        if (record && now - record.windowStart > WINDOW_MS)
            failures.delete(request.ip);
        const current = failures.get(request.ip);
        if (current && current.count >= MAX_FAILURES) {
            return reply.code(429).send({ error: "Demasiados intentos; espera 15 minutos" });
        }
        if (!tokenMatches(request.headers["x-setup-token"], expected)) {
            const next = current ?? { count: 0, windowStart: now };
            next.count += 1;
            failures.set(request.ip, next);
            return reply.code(401).send({ error: "Token de configuración inválido" });
        }
        failures.delete(request.ip);
        const missing = options.connect ? [] : missingDbEnv(env);
        if (missing.length > 0) {
            return reply.code(503).send({ error: "Base de datos no configurada", missing });
        }
    });
    async function withConnection(reply, work) {
        let conn;
        try {
            conn = await connect();
        }
        catch (err) {
            const e = err;
            return reply.code(502).send({ error: "No se pudo conectar a la base de datos", code: e.code ?? "UNKNOWN" });
        }
        try {
            return reply.send(await work(conn));
        }
        finally {
            await conn.end().catch(() => undefined);
        }
    }
    app.get("/schema", async (_request, reply) => withConnection(reply, (conn) => getSchemaStatus(conn)));
    app.post("/schema", async (_request, reply) => {
        if (running)
            return reply.code(409).send({ error: "Ya hay una aplicación del esquema en curso" });
        running = true;
        try {
            return await withConnection(reply, (conn) => applySchema(conn));
        }
        finally {
            running = false;
        }
    });
    // Crea o actualiza la cuenta de administrador y devuelve UNA vez la URI del segundo factor.
    app.post("/admin", async (request, reply) => {
        const parsed = adminInput.safeParse(request.body);
        if (!parsed.success) {
            return reply.code(400).send({
                error: "Datos inválidos: correo válido, nombre de 3 a 60 caracteres y contraseña de al menos 12",
            });
        }
        const { email, name, password } = parsed.data;
        try {
            const passwordHash = await hashPassword(password);
            const totpSecret = generateTotpSecret();
            // User.phone es obligatorio y único: las cuentas de administrador usan un marcador propio.
            const userId = await adminStore.upsertAdmin({ email, name, passwordHash, totpSecret, phone: `admin:${email}` });
            await adminStore
                .recordAudit({ eventType: "admin.account.bootstrap", actorUserId: userId, reason: "Alta desde /setup/admin" })
                .catch(() => undefined);
            return reply.send({
                ok: true,
                email,
                otpauthUri: otpauthUri(email, totpSecret),
                secret: totpSecret,
                aviso: "Registra este código en tu app de autenticación ahora: no se volverá a mostrar.",
            });
        }
        catch (err) {
            const e = err;
            return reply.code(502).send({
                error: "No se pudo crear la cuenta de administrador",
                code: e.code ?? "UNKNOWN",
                detalle: e.sqlMessage ?? null,
            });
        }
    });
}
export default setupRoutes;
//# sourceMappingURL=index.js.map