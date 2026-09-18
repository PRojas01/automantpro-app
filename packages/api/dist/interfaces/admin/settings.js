import { applySchema, getSchemaStatus } from "../../infrastructure/schema-setup/apply.js";
import { comparePassword } from "../../infrastructure/password.js";
import { checkRateLimit, recordLoginAttempt, verifyCsrf, } from "../../application/admin/security.js";
import { WHATSAPP_NUMBER_KEY, formatWhatsappNumber, normalizeWhatsappNumber, } from "../../application/settings/whatsapp-number.js";
import { settingsView } from "./views-settings.js";
import { parseAmount } from "../../application/work-orders/workflow.js";
import { FEATURES, loadPlatformSettings, parseCities, parseEntryMode, parseTime, savePlatformSettings, } from "../../application/settings/platform.js";
import { LEGAL_FIELDS, emptyLegalData, legalSettingKey, validateLegalField, } from "../../application/legal/documents.js";
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
        const legal = emptyLegalData();
        try {
            for (const field of LEGAL_FIELDS)
                legal[field.key] = await deps.settings.get(legalSettingKey(field.key));
        }
        catch {
            // sin base: los datos legales se muestran vacíos
        }
        const ai = deps.copilot ? await deps.copilot.status().catch(() => null) : null;
        let platform;
        try {
            platform = await loadPlatformSettings(deps.settings);
        }
        catch {
            platform = undefined; // sin base: la tarjeta de operación no se muestra
        }
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
        return deps.html(reply, request, "Ajustes", settingsView({ csrf: session.csrfToken, whatsapp: { stored, env: deps.envNumber() }, db, legal, ai, platform, flash }), session, status);
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
    app.post("/settings/platform", async (request, reply) => {
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
        if (!(await comparePassword(typeof body.current === "string" ? body.current : "", account.passwordHash))) {
            recordLoginAttempt(account.email, request.ip, false);
            return render(request, reply, session, { kind: "error", text: "La contraseña actual no es correcta." }, 400);
        }
        const cities = parseCities(body.cities);
        const quietFrom = parseTime(body.quietFrom);
        const quietTo = parseTime(body.quietTo);
        if ((typeof body.quietFrom === "string" && body.quietFrom.trim() !== "" && !quietFrom) || (typeof body.quietTo === "string" && body.quietTo.trim() !== "" && !quietTo)) {
            return render(request, reply, session, { kind: "error", text: "El horario silencioso usa el formato HH:MM (por ejemplo 21:00)." }, 400);
        }
        const features = {};
        for (const feature of FEATURES)
            features[feature.key] = body[`feature_${feature.key}`] === "on";
        const welcomeIntro = typeof body.welcomeIntro === "string" ? body.welcomeIntro.trim().slice(0, 300) || null : null;
        try {
            await savePlatformSettings(deps.settings, { entryMode: parseEntryMode(body.entryMode), cities, quietFrom, quietTo, welcomeIntro, features }, account.id);
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "Base de datos no disponible." }, 503);
        }
        deps.onChanged();
        const off = FEATURES.filter((f) => !features[f.key]).map((f) => f.label);
        await deps.audit("admin.settings.platform", account.id, `Operación: inicio ${parseEntryMode(body.entryMode)}, ${cities.length ? `${cities.length} ciudades` : "todas las ciudades"}, silencio ${quietFrom ?? "—"}–${quietTo ?? "—"}${off.length ? `, pausadas: ${off.join(", ")}` : ""}`);
        return render(request, reply, session, { kind: "ok", text: "Ajustes de operación guardados." });
    });
    app.post("/settings/legal", async (request, reply) => {
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
        if (!(await comparePassword(typeof body.current === "string" ? body.current : "", account.passwordHash))) {
            recordLoginAttempt(account.email, request.ip, false);
            return render(request, reply, session, { kind: "error", text: "La contraseña actual no es correcta." }, 400);
        }
        const values = LEGAL_FIELDS.map((field) => ({ field, value: typeof body[field.key] === "string" ? String(body[field.key]).trim() : "" }));
        for (const { field, value } of values) {
            const error = validateLegalField(field.key, value);
            if (error)
                return render(request, reply, session, { kind: "error", text: error }, 400);
        }
        try {
            for (const { field, value } of values) {
                if (value)
                    await deps.settings.set(legalSettingKey(field.key), value, account.id);
                else
                    await deps.settings.remove(legalSettingKey(field.key));
            }
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "Base de datos no disponible." }, 503);
        }
        deps.onChanged();
        const filled = values.filter((v) => v.value).map((v) => v.field.label).join(", ") || "ninguno";
        await deps.audit("admin.settings.legal", account.id, `Datos legales actualizados (completos: ${filled})`);
        return render(request, reply, session, { kind: "ok", text: "Datos de la empresa guardados. Las páginas de términos y privacidad ya los muestran." });
    });
    app.post("/settings/ai", async (request, reply) => {
        const ctx = checkCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        if (!deps.copilot)
            return render(request, reply, session, { kind: "error", text: "El copiloto de IA no está disponible." }, 400);
        const account = await deps.store.findAdminById(session.userId);
        if (!account)
            return render(request, reply, session, { kind: "error", text: "Cuenta no encontrada." }, 404);
        if (!checkRateLimit(account.email, request.ip).allowed) {
            return render(request, reply, session, { kind: "error", text: "Demasiados intentos. Espera unos minutos." }, 429);
        }
        if (!(await comparePassword(typeof body.current === "string" ? body.current : "", account.passwordHash))) {
            recordLoginAttempt(account.email, request.ip, false);
            return render(request, reply, session, { kind: "error", text: "La contraseña actual no es correcta." }, 400);
        }
        const budget = parseAmount(body.budget);
        if (budget === null || budget > 100)
            return render(request, reply, session, { kind: "error", text: "Tope diario no válido: entre 0 y 100 dólares." }, 400);
        const enabled = body.enabled === "on";
        try {
            await deps.copilot.setEnabled(enabled, account.id);
            await deps.copilot.setBudget(budget, account.id);
        }
        catch {
            return render(request, reply, session, { kind: "error", text: "Base de datos no disponible." }, 503);
        }
        await deps.audit("admin.settings.ai", account.id, `IA ${enabled ? "encendida" : "apagada"}, tope diario US$ ${budget.toFixed(2)}`);
        return render(request, reply, session, { kind: "ok", text: `IA ${enabled ? "encendida" : "apagada"}. Tope diario: US$ ${budget.toFixed(2)}.` });
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