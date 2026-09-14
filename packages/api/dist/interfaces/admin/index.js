import { randomBytes } from "node:crypto";
import { MysqlAdminStore } from "../../infrastructure/admin/admin-store.js";
import { openConnection, missingDbEnv } from "../../infrastructure/schema-setup/apply.js";
import { comparePassword } from "../../infrastructure/password.js";
import { SESSION_COOKIE, buildSessionClearCookie, buildSessionSetCookie, checkRateLimit, consumePendingSession, createPendingSession, deleteSession, getAdminSessionSecret, getSession, parseCookies, promoteSession, recordLoginAttempt, signSessionCookie, verifyCsrf, verifySessionCookie, verifyTotp, } from "../../application/admin/security.js";
import { dashboardView, layout, loginView, messageView, tableView, twoFactorView } from "./views.js";
import { adminCount, registerSetupWizard } from "./setup-wizard.js";
import { registerAccountRoutes } from "./account.js";
const GENERIC_LOGIN_ERROR = "Correo, contraseña o código incorrectos.";
// Hash bcrypt válido usado para igualar el tiempo de respuesta cuando el correo no existe.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7Ib6c/3QeM2vzU6ZL4t3Ai7GQWm3y3C";
export async function adminPanelRoutes(app, options = {}) {
    const connect = options.connect ?? (() => openConnection());
    const store = options.store ?? new MysqlAdminStore(connect);
    const startedAt = Date.now();
    app.decorateRequest("cspNonce", "");
    app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_request, body, done) => {
        try {
            done(null, Object.fromEntries(new URLSearchParams(String(body))));
        }
        catch (err) {
            done(err, undefined);
        }
    });
    app.addHook("onRequest", async (request, reply) => {
        request.cspNonce = randomBytes(16).toString("base64");
        reply
            .header("Content-Security-Policy", `default-src 'none'; style-src 'nonce-${request.cspNonce}'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`)
            .header("X-Frame-Options", "DENY")
            .header("X-Content-Type-Options", "nosniff")
            .header("Referrer-Policy", "no-referrer")
            .header("Cache-Control", "no-store");
        if (!getAdminSessionSecret()) {
            return reply
                .code(503)
                .type("text/html; charset=utf-8")
                .send(layout({
                title: "Panel no configurado",
                nonce: request.cspNonce,
                body: messageView("Panel no configurado", "Falta el secreto ADMIN_SESSION_SECRET en la plataforma."),
            }));
        }
    });
    function html(reply, request, title, body, session, status = 200) {
        return reply
            .code(status)
            .type("text/html; charset=utf-8")
            .send(layout({ title, nonce: request.cspNonce, body, nav: !!session, csrfToken: session?.csrfToken }));
    }
    function sessionFromCookie(request) {
        const secret = getAdminSessionSecret();
        if (!secret)
            return null;
        return verifySessionCookie(parseCookies(request.headers.cookie)[SESSION_COOKIE], secret);
    }
    function requireSession(request, reply) {
        const session = getSession(sessionFromCookie(request) ?? undefined);
        if (!session || !session.twoFactorVerified) {
            reply.redirect("/admin/login", 302);
            return null;
        }
        return session;
    }
    async function audit(eventType, actorUserId, reason) {
        await store.recordAudit({ eventType, actorUserId, reason }).catch(() => undefined);
    }
    registerSetupWizard(app, { store, connect, dbConfigured: () => !!options.connect || missingDbEnv().length === 0 });
    registerAccountRoutes(app, { store, requireSession, html, audit });
    app.get("/login", async (request, reply) => {
        // Sin administradores todavía: se abre el asistente de puesta en marcha.
        if ((await adminCount(store)) === 0)
            return reply.redirect("/admin/setup", 302);
        return html(reply, request, "Ingresar", loginView());
    });
    app.post("/login", async (request, reply) => {
        const body = (request.body ?? {});
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const limit = checkRateLimit(email, request.ip);
        if (!limit.allowed) {
            return html(reply, request, "Ingresar", loginView("Demasiados intentos. Espera unos minutos."), undefined, 429);
        }
        if (missingDbEnv().length > 0 && !options.store) {
            return html(reply, request, "Ingresar", loginView("Base de datos no configurada."), undefined, 503);
        }
        let account = null;
        try {
            account = email ? await store.findAdminByEmail(email) : null;
        }
        catch {
            return html(reply, request, "Ingresar", loginView("Base de datos no disponible."), undefined, 503);
        }
        const passwordOk = await comparePassword(password, account?.passwordHash ?? DUMMY_HASH);
        if (!account || !passwordOk || !account.totpSecret) {
            recordLoginAttempt(email, request.ip, false);
            await audit("admin.login.failed", account?.id ?? null, `Intento fallido desde ${request.ip}`);
            return html(reply, request, "Ingresar", loginView(GENERIC_LOGIN_ERROR), undefined, 401);
        }
        const pending = createPendingSession({ id: account.id, email: account.email });
        const secret = getAdminSessionSecret();
        return reply
            .header("Set-Cookie", buildSessionSetCookie(signSessionCookie(pending.id, secret), 5 * 60))
            .redirect("/admin/login/2fa", 302);
    });
    app.get("/login/2fa", async (request, reply) => {
        if (!sessionFromCookie(request))
            return reply.redirect("/admin/login", 302);
        return html(reply, request, "Verificación", twoFactorView());
    });
    app.post("/login/2fa", async (request, reply) => {
        const pendingId = sessionFromCookie(request);
        const pending = pendingId ? consumePendingSession(pendingId) : null;
        if (!pending)
            return reply.redirect("/admin/login", 302);
        const body = (request.body ?? {});
        const code = typeof body.code === "string" ? body.code.trim() : "";
        let account = null;
        try {
            account = await store.findAdminByEmail(pending.email);
        }
        catch {
            return html(reply, request, "Ingresar", loginView("Base de datos no disponible."), undefined, 503);
        }
        if (!account?.totpSecret || !verifyTotp(account.totpSecret, code)) {
            recordLoginAttempt(pending.email, request.ip, false);
            await audit("admin.login.2fa_failed", pending.userId, `Código incorrecto desde ${request.ip}`);
            return reply
                .header("Set-Cookie", buildSessionClearCookie())
                .code(401)
                .type("text/html; charset=utf-8")
                .send(layout({ title: "Ingresar", nonce: request.cspNonce, body: loginView(GENERIC_LOGIN_ERROR) }));
        }
        recordLoginAttempt(pending.email, request.ip, true);
        const active = promoteSession(pending);
        await audit("admin.login.success", active.userId, `Ingreso desde ${request.ip}`);
        const secret = getAdminSessionSecret();
        return reply.header("Set-Cookie", buildSessionSetCookie(signSessionCookie(active.id, secret))).redirect("/admin", 302);
    });
    app.post("/logout", async (request, reply) => {
        const session = getSession(sessionFromCookie(request) ?? undefined);
        const body = (request.body ?? {});
        if (session && !verifyCsrf(session, body.csrf)) {
            return html(reply, request, "Error", messageView("Solicitud inválida", "Falta el token CSRF."), session, 403);
        }
        if (session) {
            deleteSession(session.id);
            await audit("admin.logout", session.userId, "Cierre de sesión");
        }
        return reply.header("Set-Cookie", buildSessionClearCookie()).redirect("/admin/login", 302);
    });
    app.get("/", async (request, reply) => {
        const session = requireSession(request, reply);
        if (!session)
            return reply;
        let data = null;
        let dbError;
        try {
            data = await store.dashboard();
        }
        catch (err) {
            dbError = err.code ?? "Base de datos no conectada";
        }
        return html(reply, request, "Tablero", dashboardView({
            data,
            version: process.env.APP_VERSION ?? "dev",
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            dbError,
        }), session);
    });
    const lists = [
        { path: "/users", title: "Usuarios", load: (p) => store.listUsers(p), columns: [["name", "Nombre"], ["role", "Perfil"], ["locale", "Idioma"], ["createdAt", "Alta"]] },
        { path: "/vehicles", title: "Vehículos", load: (p) => store.listVehicles(p), columns: [["make", "Marca"], ["model", "Modelo"], ["year", "Año"], ["currentKm", "Km"], ["createdAt", "Alta"]] },
        { path: "/shops", title: "Talleres", load: (p) => store.listShops(p), columns: [["name", "Nombre"], ["city", "Ciudad"], ["verificationStatus", "Verificación"], ["ratingAvg", "Calificación"], ["createdAt", "Alta"]] },
        { path: "/audit", title: "Auditoría", load: (p) => store.listAudit(p), columns: [["createdAt", "Fecha"], ["eventType", "Evento"], ["actorRole", "Rol"], ["reason", "Detalle"]] },
    ];
    for (const list of lists) {
        app.get(list.path, async (request, reply) => {
            const session = requireSession(request, reply);
            if (!session)
                return reply;
            const raw = Number(request.query?.page ?? 1);
            const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
            try {
                return html(reply, request, list.title, tableView(list.title, `/admin${list.path}`, await list.load(page), list.columns), session);
            }
            catch {
                return html(reply, request, list.title, messageView(list.title, "Base de datos no conectada."), session, 503);
            }
        });
    }
}
export default adminPanelRoutes;
//# sourceMappingURL=index.js.map