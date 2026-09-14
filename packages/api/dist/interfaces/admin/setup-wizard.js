import { randomBytes } from "node:crypto";
import * as QRCode from "qrcode";
import { z } from "zod";
import { applySchema, getSchemaStatus } from "../../infrastructure/schema-setup/apply.js";
import { hashPassword } from "../../infrastructure/password.js";
import { allowInsecureAdminCookies, buildSessionSetCookie, checkRateLimit, consumePendingSession, createCsrfToken, createPendingSession, generateTotpSecret, getAdminSessionSecret, otpauthUri, parseCookies, promoteSession, recordLoginAttempt, signSessionCookie, verifyCsrf, verifySessionCookie, verifyTotp, } from "../../application/admin/security.js";
import { layout } from "./views.js";
import { setupView } from "./views-setup.js";
// Asistente de puesta en marcha en el navegador (/admin/setup): crea las tablas y la primera
// cuenta de administrador con segundo factor. Solo funciona mientras no exista ningún
// administrador; después redirige al login. La cuenta se guarda recién cuando el código TOTP
// se confirma, así nadie queda bloqueado por un QR mal escaneado.
export const SETUP_COOKIE = "amp_admin_setup";
const STATE_TTL_MS = 30 * 60 * 1000;
const states = new Map();
export function resetSetupWizardForTests() {
    states.clear();
}
const accountInput = z
    .object({
    email: z.string().trim().toLowerCase().email("Correo no válido").max(191, "Correo demasiado largo"),
    name: z
        .string()
        .trim()
        .min(3, "El nombre debe tener entre 3 y 60 caracteres")
        .max(60, "El nombre debe tener entre 3 y 60 caracteres"),
    password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(200),
    confirm: z.string(),
})
    .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden" });
export function qrSvg(text) {
    return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, width: 220 });
}
/** Cantidad de administradores; 0 si aún no existen las tablas; null si la base no responde. */
export async function adminCount(store) {
    try {
        return await store.countAdmins();
    }
    catch (err) {
        return err.code === "ER_NO_SUCH_TABLE" ? 0 : null;
    }
}
function setupCookie(value, maxAgeSeconds) {
    const secure = allowInsecureAdminCookies() ? "" : " Secure;";
    return `${SETUP_COOKIE}=${value}; HttpOnly;${secure} SameSite=Strict; Path=/admin; Max-Age=${maxAgeSeconds}`;
}
export function registerSetupWizard(app, deps) {
    const { store } = deps;
    function loadState(request) {
        const secret = getAdminSessionSecret();
        if (!secret)
            return null;
        const id = verifySessionCookie(parseCookies(request.headers.cookie)[SETUP_COOKIE], secret);
        const state = id ? states.get(id) : undefined;
        if (!state)
            return null;
        if (Date.now() - state.createdAt > STATE_TTL_MS) {
            states.delete(state.id);
            return null;
        }
        return state;
    }
    function newState(reply) {
        const state = { id: randomBytes(24).toString("base64url"), csrfToken: createCsrfToken(), createdAt: Date.now() };
        states.set(state.id, state);
        reply.header("Set-Cookie", setupCookie(signSessionCookie(state.id, getAdminSessionSecret()), STATE_TTL_MS / 1000));
        return state;
    }
    function render(request, reply, view, status = 200) {
        return reply
            .code(status)
            .type("text/html; charset=utf-8")
            .send(layout({ title: "Puesta en marcha", nonce: request.cspNonce, body: setupView(view) }));
    }
    async function withConn(work) {
        const conn = await deps.connect();
        try {
            return await work(conn);
        }
        finally {
            await conn.end().catch(() => undefined);
        }
    }
    /** Validaciones comunes de los POST; devuelve el estado o null si ya respondió. */
    async function prelude(request, reply) {
        const state = loadState(request);
        const body = (request.body ?? {});
        if (!state || !verifyCsrf(state, body.csrf)) {
            await reply
                .code(403)
                .type("text/html; charset=utf-8")
                .send(layout({
                title: "Puesta en marcha",
                nonce: request.cspNonce,
                body: `<div class="card"><p class="error">La página expiró.</p><p><a href="/admin/setup">Vuelve a abrir el asistente</a>.</p></div>`,
            }));
            return null;
        }
        const count = await adminCount(store);
        if (count !== 0) {
            await reply.redirect(count === null ? "/admin/setup" : "/admin/login", 302);
            return null;
        }
        return state;
    }
    const back = (reply) => reply.redirect("/admin/setup", 302);
    app.get("/setup", async (request, reply) => {
        if (!deps.dbConfigured())
            return render(request, reply, { kind: "no-db" }, 503);
        const count = await adminCount(store);
        if (count === null)
            return render(request, reply, { kind: "db-error" }, 503);
        if (count > 0)
            return reply.redirect("/admin/login", 302);
        let status;
        try {
            status = await withConn((conn) => getSchemaStatus(conn));
        }
        catch (err) {
            return render(request, reply, { kind: "db-error", code: err.code }, 503);
        }
        const state = loadState(request) ?? newState(reply);
        const flash = state.flash;
        state.flash = undefined;
        let pending;
        if (state.pending) {
            const uri = otpauthUri(state.pending.email, state.pending.secret);
            pending = { email: state.pending.email, secret: state.pending.secret, uri, qrSvg: await qrSvg(uri) };
        }
        return render(request, reply, {
            kind: "wizard",
            csrf: state.csrfToken,
            present: status.present.length,
            total: status.present.length + status.missing.length,
            flash,
            pending,
        });
    });
    app.post("/setup/schema", async (request, reply) => {
        const state = await prelude(request, reply);
        if (!state)
            return reply;
        try {
            const report = await withConn((conn) => applySchema(conn));
            const failed = report.results.find((r) => r.status === "failed");
            state.flash = failed
                ? { kind: "error", text: `No se pudo crear ${failed.target}: ${failed.error?.message ?? "error desconocido"}` }
                : { kind: "ok", text: `Tablas listas: ${report.after.tables}.` };
        }
        catch (err) {
            state.flash = { kind: "error", text: `No se pudo conectar a la base de datos (${err.code ?? "error"}).` };
        }
        return back(reply);
    });
    app.post("/setup/account", async (request, reply) => {
        const state = await prelude(request, reply);
        if (!state)
            return reply;
        const parsed = accountInput.safeParse(request.body);
        if (!parsed.success) {
            state.flash = { kind: "error", text: parsed.error.issues[0]?.message ?? "Datos inválidos" };
            return back(reply);
        }
        const { email, name, password } = parsed.data;
        state.pending = { email, name, passwordHash: await hashPassword(password), secret: generateTotpSecret() };
        state.flash = { kind: "ok", text: "Cuenta preparada. Falta activar el segundo factor." };
        return back(reply);
    });
    app.post("/setup/confirm", async (request, reply) => {
        const state = await prelude(request, reply);
        if (!state)
            return reply;
        if (!state.pending)
            return back(reply);
        if (!checkRateLimit("setup", request.ip).allowed) {
            state.flash = { kind: "error", text: "Demasiados intentos. Espera unos minutos." };
            return back(reply);
        }
        const body = (request.body ?? {});
        const code = typeof body.code === "string" ? body.code.trim() : "";
        if (!verifyTotp(state.pending.secret, code)) {
            recordLoginAttempt("setup", request.ip, false);
            state.flash = { kind: "error", text: "Código incorrecto. Revisa que la hora del teléfono sea automática e inténtalo de nuevo." };
            return back(reply);
        }
        const { email, name, passwordHash, secret } = state.pending;
        let userId;
        try {
            userId = await store.upsertAdmin({ email, name, passwordHash, totpSecret: secret, phone: `admin:${email}` });
        }
        catch (err) {
            const e = err;
            state.flash = { kind: "error", text: `No se pudo guardar la cuenta (${e.code ?? "error"}${e.sqlMessage ? `: ${e.sqlMessage}` : ""}).` };
            return back(reply);
        }
        recordLoginAttempt("setup", request.ip, true);
        states.delete(state.id);
        await store
            .recordAudit({ eventType: "admin.account.bootstrap", actorUserId: userId, reason: "Alta desde el asistente /admin/setup" })
            .catch(() => undefined);
        // Deja la sesión iniciada directamente.
        const pendingSession = createPendingSession({ id: userId, email });
        consumePendingSession(pendingSession.id);
        const active = promoteSession(pendingSession);
        const cookieSecret = getAdminSessionSecret();
        return reply
            .header("Set-Cookie", [setupCookie("", 0), buildSessionSetCookie(signSessionCookie(active.id, cookieSecret))])
            .redirect("/admin", 302);
    });
}
//# sourceMappingURL=setup-wizard.js.map