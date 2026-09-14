import { applySchema, getSchemaStatus } from "../../infrastructure/schema-setup/apply.js";
import { comparePassword } from "../../infrastructure/password.js";
import { checkRateLimit, recordLoginAttempt, verifyCsrf, } from "../../application/admin/security.js";
import { WHATSAPP_NUMBER_KEY, formatWhatsappNumber, normalizeWhatsappNumber, } from "../../application/settings/whatsapp-number.js";
import { settingsView } from "./views-settings.js";
export function registerSettingsRoutes(app, deps) {
    async function withConn(work) {
        const conn = await deps.connect();
        try {
            return await work(conn);
        }
        finally {
            await conn.end().catch(() => undefined);
        }
    }
    async function render(request, reply, session, flash, status = 200) {
        let stored = null;
        let db = null;
        try {
            stored = await deps.settings.get(WHATSAPP_NUMBER_KEY);
        }
        catch {
            // sin base: se muestra el secreto de la plataforma
        }
        try {
            const s = await withConn((conn) => getSchemaStatus(conn));
            db = { present: s.present.length, total: s.present.length + s.missing.length };
        }
        catch {
            db = null;
        }
        return deps.html(reply, request, "Ajustes", settingsView({ csrf: session.csrfToken, whatsapp: { stored, env: deps.envNumber() }, db, flash }), session, status);
    }
    function checkCsrf(request, reply) {
        const session = deps.requireSession(request, reply);
        if (!session)
            return null;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            deps.html(reply, request, "Ajustes", `<p class="error">Solicitud inválida: vuelve a abrir la página.</p>`, session, 403);
            return null;
        }
        return { session, body };
    }
    app.get("/settings", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        return render(request, reply, session);
    });
    app.post("/settings/whatsapp", async (request, reply) => {
        const ctx = checkCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const account = await deps.store.findAdminById(session.userId);
        if (!account)
            return render(request, reply, session, { kind: "error", text: "Cuenta no encontrada." }, 404);
        if (!checkRateLimit(account.email, request.ip).allowed) {
            return render(request, reply, session, { kind: "error", text: "Demasiados intentos. Espera unos minutos." }, 429);
        }
        const passwordOk = await comparePassword(typeof body.current === "string" ? body.current : "", account.passwordHash);
        if (!passwordOk) {
            recordLoginAttempt(account.email, request.ip, false);
            return render(request, reply, session, { kind: "error", text: "La contraseña actual no es correcta." }, 400);
        }
        let before = null;
        try {
            before = await deps.settings.get(WHATSAPP_NUMBER_KEY);
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "Base de datos no disponible." }, 503);
        }
        if (body.action === "remove") {
            await deps.settings.remove(WHATSAPP_NUMBER_KEY);
            deps.onChanged();
            await deps.audit("admin.settings.whatsapp", account.id, `Número público de WhatsApp: ${before ?? "—"} → secreto de la plataforma`);
            return render(request, reply, session, { kind: "ok", text: "Número quitado. La página usa el secreto de GoDaddy." });
        }
        const number = normalizeWhatsappNumber(body.number);
        if (!number) {
            return render(request, reply, session, { kind: "error", text: "Número no válido. Un celular de Ecuador tiene 9 dígitos después de +593 (por ejemplo +593 99 123 4567 o 099 123 4567). Revisa que no falte ningún dígito." }, 400);
        }
        await deps.settings.set(WHATSAPP_NUMBER_KEY, number, account.id);
        deps.onChanged();
        await deps.audit("admin.settings.whatsapp", account.id, `Número público de WhatsApp: ${before ?? "—"} → ${number}`);
        return render(request, reply, session, {
            kind: "ok",
            text: `Número actualizado a ${formatWhatsappNumber(number)}. La página de inicio ya lo usa.`,
        });
    });
    app.post("/settings/schema", async (request, reply) => {
        const ctx = checkCsrf(request, reply);
        if (!ctx)
            return reply;
        let flash;
        try {
            const report = await withConn((conn) => applySchema(conn));
            const failed = report.results.find((r) => r.status === "failed");
            flash = failed
                ? { kind: "error", text: `No se pudo aplicar ${failed.target}: ${failed.error?.message ?? "error desconocido"}` }
                : { kind: "ok", text: `Base de datos actualizada: ${report.after.tables} tablas.` };
            if (!failed)
                await deps.audit("admin.settings.schema", ctx.session.userId, `Esquema aplicado: ${report.applied} cambios`);
        }
        catch (err) {
            flash = { kind: "error", text: `No se pudo conectar a la base de datos (${err.code ?? "error"}).` };
        }
        return render(request, reply, ctx.session, flash);
    });
}
//# sourceMappingURL=settings.js.map