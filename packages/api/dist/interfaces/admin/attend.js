import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { detectProfileIntent, parseContactInput, pendingTasks, welcomeMessage } from "../../application/attend/welcome.js";
import { attendView } from "./views-attend.js";
import { quietNotice } from "../../application/settings/platform.js";
import { effectivePlan, limitsFor, nearbyWorkshopsMessage } from "../../application/plans/plans.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DRAFTS_PER_HOUR = 30;
export function registerAttendRoutes(app, deps) {
    const draftsBySession = new Map();
    function allowDraft(sessionId) {
        const now = Date.now();
        const recent = (draftsBySession.get(sessionId) ?? []).filter((t) => now - t < 60 * 60 * 1000);
        if (recent.length >= DRAFTS_PER_HOUR) {
            draftsBySession.set(sessionId, recent);
            return false;
        }
        recent.push(now);
        draftsBySession.set(sessionId, recent);
        return true;
    }
    function withCsrf(request, reply) {
        const session = deps.requireSession(request, reply);
        if (!session)
            return null;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            deps.html(reply, request, "Atender", `<div class="card"><p class="error">Solicitud inválida: vuelve a abrir la página.</p></div>`, session, 403);
            return null;
        }
        return { session, body };
    }
    async function operation() {
        return deps.platform ? deps.platform().catch(() => null) : null;
    }
    /** Identifica al contacto y reúne su contexto: perfil, turnos, órdenes, cotizaciones y notas. */
    async function resolve(query, intro) {
        const { phone, code } = parseContactInput(query);
        let detail = null;
        let appointments = [];
        let events = [];
        let workOrders = [];
        let quotes = null;
        if (phone) {
            const found = await deps.registrations.searchUsers(phone.replace(/\D/g, ""), 1);
            const row = found.items.find((u) => String(u.phone) === phone);
            if (row)
                detail = await deps.registrations.getUserDetail(String(row.id));
        }
        if (detail && deps.workOrders)
            workOrders = await deps.workOrders.listForUser(String(detail.user.id));
        if (detail && deps.quotes)
            quotes = await deps.quotes.listForUser(String(detail.user.id));
        if (detail && deps.appointments) {
            [appointments, events] = await Promise.all([
                deps.appointments.listForUser(String(detail.user.id)),
                deps.appointments.userEvents(String(detail.user.id), 10),
            ]);
        }
        let visit = null;
        let visitLookup = false;
        if (code && deps.visits) {
            try {
                visit = await deps.visits.find(code);
                visitLookup = true;
                // El código se liga al teléfono desde el que escribieron y, si ya está registrado, a su
                // ficha: así se puede seguir de dónde vino cada usuario (docs/43).
                if (visit && phone)
                    await deps.visits.claim(code, phone).catch(() => undefined);
                if (visit && detail)
                    await deps.visits.link(code, String(detail.user.id)).catch(() => undefined);
            }
            catch {
                visitLookup = false;
            }
        }
        // Plan del contacto: decide si se le ofrecen talleres verificados o el enlace del mapa.
        let plan = "gratis";
        let limits = [];
        let nearby = null;
        if (detail && deps.plans) {
            try {
                const [subs, usage] = await Promise.all([deps.plans.forUser(String(detail.user.id)), deps.plans.usageForUser(String(detail.user.id))]);
                plan = effectivePlan(subs);
                limits = limitsFor(plan, String(detail.user.role ?? "dueno"), usage);
            }
            catch {
                plan = "gratis";
            }
            if (plan === "gratis")
                nearby = nearbyWorkshopsMessage(String(detail.user.city ?? ""), "");
        }
        const ctx = { detail, appointments, events, workOrders, quotes };
        // La intención sale del mensaje pegado o de la opción que eligió en el menú de inicio.
        const intent = detectProfileIntent(query) ?? visit?.profile ?? null;
        return {
            ctx,
            result: { phone, code, visit, visitLookup, detail, intent, plan, limits, nearby, tasks: pendingTasks(ctx), message: welcomeMessage(ctx, { intro }) },
        };
    }
    async function copilotStatus() {
        return deps.copilot ? deps.copilot.status().catch(() => null) : null;
    }
    function databaseError(request, reply, session, query, err) {
        const code = err.code ?? "base de datos no disponible";
        return deps.html(reply, request, "Atender", `${attendView({ csrf: session.csrfToken, query })}<div class="card"><p class="error">No se pudo consultar la base de datos (${escapeHtml(code)}).</p></div>`, session, 502);
    }
    app.get("/attend", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const op = await operation();
        return deps.html(reply, request, "Atender", attendView({ csrf: session.csrfToken, query: "", notice: op ? (quietNotice(op) ?? undefined) : undefined }), session);
    });
    app.post("/attend", async (request, reply) => {
        const csrfCtx = withCsrf(request, reply);
        if (!csrfCtx)
            return reply;
        const { session, body } = csrfCtx;
        const query = typeof body.q === "string" ? body.q.slice(0, 2000) : "";
        const op = await operation();
        let resolved;
        try {
            resolved = await resolve(query, op?.welcomeIntro ?? null);
        }
        catch (err) {
            return databaseError(request, reply, session, query, err);
        }
        return deps.html(reply, request, "Atender", attendView({
            csrf: session.csrfToken,
            query,
            result: resolved.result,
            copilot: await copilotStatus(),
            customerText: query,
            notice: op ? (quietNotice(op) ?? undefined) : undefined,
        }), session);
    });
    app.post("/attend/draft", async (request, reply) => {
        const csrfCtx = withCsrf(request, reply);
        if (!csrfCtx)
            return reply;
        const { session, body } = csrfCtx;
        const query = typeof body.q === "string" ? body.q.slice(0, 2000) : "";
        const customerText = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
        const instruction = typeof body.instruction === "string" ? body.instruction.trim().slice(0, 300) || null : null;
        const op = await operation();
        let resolved;
        try {
            resolved = await resolve(query, op?.welcomeIntro ?? null);
        }
        catch (err) {
            return databaseError(request, reply, session, query, err);
        }
        let draft;
        if (!deps.copilot) {
            draft = { ok: false, reason: "not_configured", message: "El copiloto de IA no está disponible.", usageId: null };
        }
        else if (!resolved.result.phone) {
            draft = { ok: false, reason: "error", message: "Primero identifica al contacto con su número.", usageId: null };
        }
        else if (customerText.length < 2) {
            draft = { ok: false, reason: "error", message: "Pega el mensaje del cliente para que la IA lo responda.", usageId: null };
        }
        else if (!allowDraft(session.id)) {
            draft = { ok: false, reason: "error", message: `Llegaste al límite de ${DRAFTS_PER_HOUR} borradores por hora.`, usageId: null };
        }
        else {
            const name = resolved.ctx.detail ? String(resolved.ctx.detail.user.name ?? "").trim().split(/\s+/)[0] || null : null;
            draft = await deps.copilot.draft({ ctx: resolved.ctx, customerText, instruction, firstName: name });
            const who = resolved.ctx.detail ? `usuario ${String(resolved.ctx.detail.user.id)}` : "contacto nuevo";
            await deps.audit?.("admin.copilot.draft", session.userId, `Borrador de IA para ${who}: ${draft.ok ? "ok" : draft.reason}`).catch(() => undefined);
        }
        return deps.html(reply, request, "Atender", attendView({
            csrf: session.csrfToken,
            query,
            result: resolved.result,
            copilot: await copilotStatus(),
            draft,
            customerText,
            instruction: instruction ?? "",
            notice: op ? (quietNotice(op) ?? undefined) : undefined,
        }), session);
    });
    app.post("/attend/feedback", async (request, reply) => {
        const csrfCtx = withCsrf(request, reply);
        if (!csrfCtx)
            return reply;
        const { session, body } = csrfCtx;
        const query = typeof body.q === "string" ? body.q.slice(0, 2000) : "";
        const usageId = typeof body.usageId === "string" && UUID.test(body.usageId) ? body.usageId : null;
        const good = body.score === "good";
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 191) || null : null;
        let resolved;
        try {
            resolved = await resolve(query);
        }
        catch (err) {
            return databaseError(request, reply, session, query, err);
        }
        let flash = "No se pudo guardar la valoración.";
        if (usageId && deps.copilot) {
            try {
                await deps.copilot.feedback({ usageId, userId: resolved.ctx.detail ? String(resolved.ctx.detail.user.id) : null, good, reason });
                flash = "Gracias: valoración guardada.";
            }
            catch {
                flash = "No se pudo guardar la valoración (base de datos no disponible).";
            }
        }
        return deps.html(reply, request, "Atender", attendView({ csrf: session.csrfToken, query, result: resolved.result, copilot: await copilotStatus(), customerText: query, flash }), session);
    });
}
//# sourceMappingURL=attend.js.map