import { z } from "zod";
import { comparePassword, hashPassword } from "../../infrastructure/password.js";
import { checkRateLimit, generateTotpSecret, otpauthUri, recordLoginAttempt, verifyCsrf, verifyTotp, } from "../../application/admin/security.js";
import { accountView } from "./views-setup.js";
import { qrSvg } from "./setup-wizard.js";
const TOTP_TTL_MS = 10 * 60 * 1000;
const pendingTotp = new Map();
export function resetAccountStateForTests() {
    pendingTotp.clear();
}
const profileInput = z.object({
    email: z.string().trim().toLowerCase().email("Correo no válido").max(191, "Correo demasiado largo"),
    name: z
        .string()
        .trim()
        .min(3, "El nombre debe tener entre 3 y 60 caracteres")
        .max(60, "El nombre debe tener entre 3 y 60 caracteres"),
});
const passwordInput = z
    .object({
    password: z.string().min(12, "La nueva contraseña debe tener al menos 12 caracteres").max(200),
    confirm: z.string(),
})
    .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden" });
export function registerAccountRoutes(app, deps) {
    const { store } = deps;
    async function render(request, reply, session, flash, status = 200) {
        const account = await store.findAdminById(session.userId);
        if (!account) {
            return deps.html(reply, request, "Mi cuenta", `<p class="error">Cuenta no encontrada.</p>`, session, 404);
        }
        const pending = pendingTotp.get(session.id);
        let totp;
        if (pending && Date.now() - pending.createdAt <= TOTP_TTL_MS) {
            const uri = otpauthUri(account.email, pending.secret);
            totp = { secret: pending.secret, uri, qrSvg: await qrSvg(uri) };
        }
        else {
            pendingTotp.delete(session.id);
        }
        return deps.html(reply, request, "Mi cuenta", accountView({ csrf: session.csrfToken, name: account.name, email: account.email, flash, totp }), session, status);
    }
    async function guard(request, reply, needsPassword) {
        const session = deps.requireSession(request, reply);
        if (!session)
            return null;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            await deps.html(reply, request, "Mi cuenta", `<p class="error">Solicitud inválida: vuelve a abrir la página.</p>`, session, 403);
            return null;
        }
        const account = await store.findAdminById(session.userId);
        if (!account) {
            await deps.html(reply, request, "Mi cuenta", `<p class="error">Cuenta no encontrada.</p>`, session, 404);
            return null;
        }
        if (needsPassword) {
            if (!checkRateLimit(account.email, request.ip).allowed) {
                await render(request, reply, session, { kind: "error", text: "Demasiados intentos. Espera unos minutos." }, 429);
                return null;
            }
            const ok = await comparePassword(typeof body.current === "string" ? body.current : "", account.passwordHash);
            if (!ok) {
                recordLoginAttempt(account.email, request.ip, false);
                await render(request, reply, session, { kind: "error", text: "La contraseña actual no es correcta." }, 400);
                return null;
            }
        }
        return { session, account, body };
    }
    app.get("/account", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        try {
            return await render(request, reply, session);
        }
        catch {
            return deps.html(reply, request, "Mi cuenta", `<p class="error">Base de datos no disponible.</p>`, session, 503);
        }
    });
    app.post("/account/profile", async (request, reply) => {
        const ctx = await guard(request, reply, true);
        if (!ctx)
            return reply;
        const parsed = profileInput.safeParse(ctx.body);
        if (!parsed.success) {
            return render(request, reply, ctx.session, { kind: "error", text: parsed.error.issues[0]?.message ?? "Datos inválidos" }, 400);
        }
        try {
            await store.updateAdminProfile(ctx.account.id, parsed.data);
        }
        catch (err) {
            const duplicate = err.code === "ER_DUP_ENTRY";
            return render(request, reply, ctx.session, { kind: "error", text: duplicate ? "Ese correo ya está en uso." : "No se pudieron guardar los datos." }, duplicate ? 409 : 502);
        }
        await deps.audit("admin.account.profile", ctx.account.id, "Datos de la cuenta actualizados");
        return render(request, reply, ctx.session, { kind: "ok", text: "Datos actualizados." });
    });
    app.post("/account/password", async (request, reply) => {
        const ctx = await guard(request, reply, true);
        if (!ctx)
            return reply;
        const parsed = passwordInput.safeParse(ctx.body);
        if (!parsed.success) {
            return render(request, reply, ctx.session, { kind: "error", text: parsed.error.issues[0]?.message ?? "Datos inválidos" }, 400);
        }
        await store.updateAdminPassword(ctx.account.id, await hashPassword(parsed.data.password));
        await deps.audit("admin.account.password", ctx.account.id, "Contraseña cambiada");
        return render(request, reply, ctx.session, { kind: "ok", text: "Contraseña actualizada." });
    });
    app.post("/account/totp/start", async (request, reply) => {
        const ctx = await guard(request, reply, true);
        if (!ctx)
            return reply;
        pendingTotp.set(ctx.session.id, { secret: generateTotpSecret(), createdAt: Date.now() });
        return render(request, reply, ctx.session, {
            kind: "ok",
            text: "Escanea el código nuevo y confirma con los 6 dígitos. Hasta confirmar sigue valiendo el dispositivo anterior.",
        });
    });
    app.post("/account/totp/confirm", async (request, reply) => {
        const ctx = await guard(request, reply, false);
        if (!ctx)
            return reply;
        const pending = pendingTotp.get(ctx.session.id);
        if (!pending || Date.now() - pending.createdAt > TOTP_TTL_MS) {
            pendingTotp.delete(ctx.session.id);
            return render(request, reply, ctx.session, { kind: "error", text: "El cambio expiró. Vuelve a iniciarlo." }, 400);
        }
        if (!checkRateLimit(ctx.account.email, request.ip).allowed) {
            return render(request, reply, ctx.session, { kind: "error", text: "Demasiados intentos. Espera unos minutos." }, 429);
        }
        const code = typeof ctx.body.code === "string" ? ctx.body.code.trim() : "";
        if (!verifyTotp(pending.secret, code)) {
            recordLoginAttempt(ctx.account.email, request.ip, false);
            return render(request, reply, ctx.session, { kind: "error", text: "Código incorrecto. Revisa que la hora del teléfono sea automática e inténtalo de nuevo." }, 400);
        }
        await store.updateAdminTotp(ctx.account.id, pending.secret);
        pendingTotp.delete(ctx.session.id);
        await deps.audit("admin.account.totp", ctx.account.id, "Dispositivo del segundo factor cambiado");
        return render(request, reply, ctx.session, { kind: "ok", text: "Segundo factor actualizado." });
    });
}
//# sourceMappingURL=account.js.map