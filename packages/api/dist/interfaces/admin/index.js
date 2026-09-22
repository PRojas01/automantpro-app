import { randomBytes } from "node:crypto";
import { MysqlAdminStore } from "../../infrastructure/admin/admin-store.js";
import { openConnection, missingDbEnv } from "../../infrastructure/schema-setup/apply.js";
import { comparePassword } from "../../infrastructure/password.js";
import { SESSION_COOKIE, buildSessionClearCookie, buildSessionSetCookie, checkRateLimit, consumePendingSession, createPendingSession, deleteSession, getAdminSessionSecret, getSession, parseCookies, promoteSession, recordLoginAttempt, signSessionCookie, verifyCsrf, verifySessionCookie, verifyTotp, generateTotpSecret, otpauthUri, } from "../../application/admin/security.js";
import { can, requiredCapability } from "../../application/admin/permissions.js";
import { dashboardView, layout, loginView, messageView, tableView, twoFactorView } from "./views.js";
import { adminCount, qrSvg, registerSetupWizard } from "./setup-wizard.js";
import { registerTeamRoutes } from "./team.js";
import { enrollView } from "./views-team.js";
import { MysqlStaffStore } from "../../infrastructure/staff/staff-store.js";
import { registerRelationRoutes } from "./relations.js";
import { registerDataRoutes } from "./data.js";
import { registerPlanRoutes } from "./plans.js";
import { registerServiceRequestRoutes } from "./service-requests.js";
import { MysqlServiceRequestStore } from "../../infrastructure/service-requests/service-request-store.js";
import { MysqlRatingStore } from "../../infrastructure/ratings/rating-store.js";
import { MysqlPlanStore } from "../../infrastructure/plans/plan-store.js";
import { MysqlDataStore } from "../../infrastructure/data/data-store.js";
import { MysqlRelationStore } from "../../infrastructure/relations/relation-store.js";
import { createRelationLinker } from "../../application/relations/linker.js";
import { emptyPlatformSettings, loadPlatformSettings } from "../../application/settings/platform.js";
import { registerAccountRoutes } from "./account.js";
import { registerSettingsRoutes } from "./settings.js";
import { registerRegistrationRoutes } from "./registrations.js";
import { registerAppointmentRoutes } from "./appointments.js";
import { registerAttendRoutes } from "./attend.js";
import { registerWorkOrderRoutes } from "./work-orders.js";
import { registerQuoteRoutes } from "./quotes.js";
import { MysqlQuoteStore } from "../../infrastructure/quotes/quote-store.js";
import { CopilotService } from "../../application/copilot/service.js";
import { MysqlCopilotStore } from "../../infrastructure/copilot/copilot-store.js";
import { MysqlWorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
import { MysqlVisitStore } from "../../infrastructure/visits/visit-store.js";
import { visitsView } from "./views-visits.js";
import { MysqlAppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import { MysqlRegistrationStore } from "../../infrastructure/registration/registration-store.js";
import { MysqlSettingsStore } from "../../infrastructure/settings/settings-store.js";
import { publicNumber } from "../entry/index.js";
const GENERIC_LOGIN_ERROR = "Correo, contraseña o código incorrectos.";
const ENROLL_TTL_MS = 10 * 60 * 1000;
/** Registros de segundo factor en curso (primer ingreso de un miembro nuevo del equipo). */
const enrollments = new Map();
export function resetEnrollmentsForTests() {
    enrollments.clear();
}
// Hash bcrypt válido usado para igualar el tiempo de respuesta cuando el correo no existe.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7Ib6c/3QeM2vzU6ZL4t3Ai7GQWm3y3C";
export async function adminPanelRoutes(app, options = {}) {
    const connect = options.connect ?? (() => openConnection());
    const store = options.store ?? new MysqlAdminStore(connect);
    const settings = options.settings ?? new MysqlSettingsStore(connect);
    const registrations = options.registrations ?? new MysqlRegistrationStore(connect);
    const appointments = options.appointments ?? new MysqlAppointmentStore(connect);
    // La ficha consulta turnos y bitácora solo si hay base configurada (evita esperas en pruebas sin base).
    const detailAppointments = options.appointments || options.connect || missingDbEnv().length === 0 ? appointments : undefined;
    const workOrders = options.workOrders ?? new MysqlWorkOrderStore(connect);
    const detailWorkOrders = options.workOrders || options.connect || missingDbEnv().length === 0 ? workOrders : undefined;
    const quotes = options.quotes ?? new MysqlQuoteStore(connect);
    const detailQuotes = options.quotes || options.connect || missingDbEnv().length === 0 ? quotes : undefined;
    const copilot = options.copilot ?? new CopilotService({ settings, store: new MysqlCopilotStore(connect) });
    const detailCopilot = options.copilot || options.connect || missingDbEnv().length === 0 ? copilot : undefined;
    const staff = options.staff ?? new MysqlStaffStore(connect);
    const visits = options.visits ?? new MysqlVisitStore(connect);
    const detailVisits = options.visits || options.connect || missingDbEnv().length === 0 ? visits : undefined;
    const relations = options.relations ?? new MysqlRelationStore(connect);
    const data = options.data ?? new MysqlDataStore(connect);
    const plans = options.plans ?? new MysqlPlanStore(connect);
    const serviceRequests = options.serviceRequests ?? new MysqlServiceRequestStore(connect);
    const ratings = options.ratings ?? new MysqlRatingStore(connect);
    const detailRatings = options.ratings || options.connect || missingDbEnv().length === 0 ? ratings : undefined;
    const detailPlans = options.plans || options.connect || missingDbEnv().length === 0 ? plans : undefined;
    const detailData = options.data || options.connect || missingDbEnv().length === 0 ? data : undefined;
    // El enlazador crea el vínculo al agendar, abrir una orden o cotizar; sin base no se usa.
    const detailRelations = options.relations || options.connect || missingDbEnv().length === 0 ? relations : undefined;
    const linker = detailRelations ? createRelationLinker(detailRelations) : undefined;
    // Ajustes de operación (ciudades, silencio, interruptores) con caché de un minuto; al guardarlos
    // desde Ajustes se invalida para que el cambio se note de inmediato.
    let platformCache = null;
    const platform = async () => {
        if (platformCache && Date.now() - platformCache.at < 60_000)
            return platformCache.value;
        try {
            const value = await loadPlatformSettings(settings);
            platformCache = { value, at: Date.now() };
            return value;
        }
        catch {
            return emptyPlatformSettings();
        }
    };
    const dashboardDb = () => !!options.connect || !!options.registrations || missingDbEnv().length === 0;
    const startedAt = Date.now();
    app.decorateRequest("cspNonce", "");
    app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_request, body, done) => {
        try {
            // Los campos repetidos (casillas de selección múltiple) llegan como arreglo.
            const parsed = {};
            for (const [key, value] of new URLSearchParams(String(body))) {
                const previous = parsed[key];
                parsed[key] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value];
            }
            done(null, parsed);
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
    // Gancho central de permisos (docs/39 §3): una sola puerta para todo el panel, de modo que
    // ninguna ruta quede sin revisar. Sin sesión no decide nada: cada ruta redirige al login.
    app.addHook("onRequest", async (request, reply) => {
        const path = request.url.replace(/^\/admin/, "").split("?")[0] || "/";
        const capability = requiredCapability(request.method, path);
        if (!capability)
            return;
        const session = getSession(sessionFromCookie(request) ?? undefined);
        if (!session || !session.twoFactorVerified)
            return;
        if (can(session.role, capability))
            return;
        return reply
            .code(403)
            .type("text/html; charset=utf-8")
            .send(layout({
            title: "Sin permiso",
            nonce: request.cspNonce,
            role: session.role,
            nav: true,
            csrfToken: session.csrfToken,
            body: messageView("Sin permiso", "Tu rol no incluye esta sección. Si la necesitas, pídele a un administrador que te cambie el rol."),
        }));
    });
    function html(reply, request, title, body, session, status = 200) {
        return reply
            .code(status)
            .type("text/html; charset=utf-8")
            .send(layout({ title, nonce: request.cspNonce, body, nav: !!session, csrfToken: session?.csrfToken, role: session?.role }));
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
    registerRegistrationRoutes(app, { registrations, appointments: detailAppointments, workOrders: detailWorkOrders, quotes: detailQuotes, relations: detailRelations, data: detailData, plans: detailPlans, visits: detailVisits, requireSession, html, audit, platform });
    registerAppointmentRoutes(app, { appointments, registrations, workOrders: detailWorkOrders, requireSession, html, audit, linker, platform });
    registerWorkOrderRoutes(app, { workOrders, appointments, registrations, requireSession, html, audit, linker, platform, ratings: detailRatings });
    registerQuoteRoutes(app, { quotes, registrations, appointments, workOrders, requireSession, html, audit, linker, platform });
    registerAttendRoutes(app, {
        registrations,
        appointments: detailAppointments,
        workOrders: detailWorkOrders,
        quotes: detailQuotes,
        copilot: detailCopilot,
        plans: detailPlans,
        audit,
        visits: detailVisits,
        platform,
        requireSession,
        html,
    });
    registerSettingsRoutes(app, {
        store,
        settings,
        connect,
        requireSession,
        html,
        audit,
        envNumber: publicNumber,
        copilot: detailCopilot,
        onChanged: () => {
            platformCache = null;
            options.onSettingsChanged?.();
        },
    });
    registerTeamRoutes(app, { store, staff, requireSession, html, audit });
    registerRelationRoutes(app, { relations, requireSession, html, audit });
    registerDataRoutes(app, { data, requireSession, html, audit });
    registerPlanRoutes(app, { plans, requireSession, html, audit });
    registerServiceRequestRoutes(app, { serviceRequests, registrations, linker, requireSession, html, audit });
    /** Moderación de reseñas (docs/46): ocultar con motivo, nunca borrar. */
    app.post("/ratings/:id/hide", async (request, reply) => {
        const session = requireSession(request, reply);
        if (!session)
            return reply;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf))
            return html(reply, request, "Reseñas", messageView("Reseñas", "Solicitud inválida."), session, 403);
        const { id } = request.params;
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 191) : "";
        if (reason.length < 5)
            return html(reply, request, "Reseñas", messageView("Reseñas", "Escribe el motivo para ocultarla."), session, 400);
        const rating = await ratings.get(id).catch(() => null);
        const hidden = rating ? await ratings.hide(id, reason, session.userId).catch(() => false) : false;
        if (hidden)
            await audit("admin.rating.hide", session.userId, `Reseña ${id} oculta: ${reason}`);
        return reply.redirect(rating?.workOrderId ? `/admin/work-orders/${rating.workOrderId}` : "/admin", 302);
    });
    app.post("/ratings/:id/show", async (request, reply) => {
        const session = requireSession(request, reply);
        if (!session)
            return reply;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf))
            return html(reply, request, "Reseñas", messageView("Reseñas", "Solicitud inválida."), session, 403);
        const { id } = request.params;
        const rating = await ratings.get(id).catch(() => null);
        const shown = rating ? await ratings.show(id).catch(() => false) : false;
        if (shown)
            await audit("admin.rating.show", session.userId, `Reseña ${id} visible otra vez`);
        return reply.redirect(rating?.workOrderId ? `/admin/work-orders/${rating.workOrderId}` : "/admin", 302);
    });
    /** Bandeja de origen: qué código llegó por dónde y en qué terminó (docs/43). */
    app.get("/visits", async (request, reply) => {
        const session = requireSession(request, reply);
        if (!session)
            return reply;
        const raw = Number(request.query?.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        const days = 30;
        try {
            const [list, stats] = await Promise.all([visits.list(page), visits.stats(days)]);
            return html(reply, request, "Origen", visitsView({ items: list.items, stats, days }), session);
        }
        catch (err) {
            const code = err.code;
            const text = code === "ER_NO_SUCH_TABLE"
                ? "La base de datos necesita actualizarse: ve a Ajustes y pulsa «Aplicar actualizaciones»."
                : `No se pudo consultar el origen de los contactos (${code ?? "base de datos no disponible"}).`;
            return html(reply, request, "Origen", messageView("Origen", text), session, 503);
        }
    });
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
        if (!account || !passwordOk) {
            recordLoginAttempt(email, request.ip, false);
            await audit("admin.login.failed", account?.id ?? null, `Intento fallido desde ${request.ip}`);
            return html(reply, request, "Ingresar", loginView(GENERIC_LOGIN_ERROR), undefined, 401);
        }
        const pending = createPendingSession({ id: account.id, email: account.email, role: account.staffRole });
        const secret = getAdminSessionSecret();
        // Cuenta nueva del equipo: primero registra su propio segundo factor.
        if (!account.totpSecret) {
            enrollments.set(pending.id, { secret: generateTotpSecret(), userId: account.id, email: account.email, createdAt: Date.now() });
            return reply
                .header("Set-Cookie", buildSessionSetCookie(signSessionCookie(pending.id, secret), 10 * 60))
                .redirect("/admin/login/enroll", 302);
        }
        return reply
            .header("Set-Cookie", buildSessionSetCookie(signSessionCookie(pending.id, secret), 5 * 60))
            .redirect("/admin/login/2fa", 302);
    });
    app.get("/login/enroll", async (request, reply) => {
        const pendingId = sessionFromCookie(request);
        const entry = pendingId ? enrollments.get(pendingId) : undefined;
        if (!pendingId || !entry || Date.now() - entry.createdAt > ENROLL_TTL_MS) {
            if (pendingId)
                enrollments.delete(pendingId);
            return reply.redirect("/admin/login", 302);
        }
        const uri = otpauthUri(entry.email, entry.secret);
        return html(reply, request, "Segundo factor", enrollView({ qrSvg: await qrSvg(uri), secret: entry.secret }));
    });
    app.post("/login/enroll", async (request, reply) => {
        const pendingId = sessionFromCookie(request);
        const entry = pendingId ? enrollments.get(pendingId) : undefined;
        if (!pendingId || !entry || Date.now() - entry.createdAt > ENROLL_TTL_MS) {
            if (pendingId)
                enrollments.delete(pendingId);
            return reply.redirect("/admin/login", 302);
        }
        const body = (request.body ?? {});
        const code = typeof body.code === "string" ? body.code.trim() : "";
        if (!checkRateLimit(entry.email, request.ip).allowed) {
            return html(reply, request, "Ingresar", loginView("Demasiados intentos. Espera unos minutos."), undefined, 429);
        }
        if (!verifyTotp(entry.secret, code)) {
            recordLoginAttempt(entry.email, request.ip, false);
            const uri = otpauthUri(entry.email, entry.secret);
            return html(reply, request, "Segundo factor", enrollView({ qrSvg: await qrSvg(uri), secret: entry.secret, error: "Código incorrecto. Revisa que la hora del teléfono sea automática." }), undefined, 401);
        }
        try {
            await staff.setTotp(entry.userId, entry.secret);
        }
        catch {
            return html(reply, request, "Ingresar", loginView("Base de datos no disponible."), undefined, 503);
        }
        const pending = consumePendingSession(pendingId);
        enrollments.delete(pendingId);
        if (!pending)
            return reply.redirect("/admin/login", 302);
        recordLoginAttempt(entry.email, request.ip, true);
        const active = promoteSession(pending);
        await audit("admin.login.enroll", active.userId, `Segundo factor registrado desde ${request.ip}`);
        const secret = getAdminSessionSecret();
        return reply.header("Set-Cookie", buildSessionSetCookie(signSessionCookie(active.id, secret))).redirect("/admin", 302);
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
        let recent = null;
        let pending = null;
        if (dashboardDb()) {
            try {
                [recent, pending] = await Promise.all([registrations.recentUsers(5), registrations.pendingCount()]);
            }
            catch {
                recent = null;
                pending = null;
            }
        }
        return html(reply, request, "Tablero", dashboardView({
            data,
            recent,
            pendingVerifications: pending,
            version: process.env.APP_VERSION ?? "dev",
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            dbError,
        }), session);
    });
    const lists = [
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