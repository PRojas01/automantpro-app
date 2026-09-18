import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { can } from "../../application/admin/permissions.js";
import { canTransition, counterpart, disputeCode, groupAllowed, nextSanctionLevel, relationCode, relayMessage, sanctionEnd, sanctionLevel, } from "../../application/relations/workflow.js";
import { disputesListView, relationDetailView, relationsListView, sanctionsListView } from "./views-relations.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = ["abiertas", "esperando", "disputa", "cerradas", "todas"];
const DISPUTE_STATUSES = ["abierta", "en_revision", "resuelta", "rechazada", "todas"];
export function registerRelationRoutes(app, deps) {
    const { relations } = deps;
    const lateAfter = deps.waitingHours ?? 24;
    const errorPage = (request, reply, session, title, text, status) => deps.html(reply, request, title, `<div class="card"><p class="error">${escapeHtml(text)}</p></div>`, session, status);
    function dbError(err) {
        const code = err.code;
        if (code === "ER_NO_SUCH_TABLE" || code === "ER_BAD_FIELD_ERROR") {
            return { status: 503, text: "La base de datos necesita actualizarse: ve a Ajustes y pulsa «Aplicar actualizaciones»." };
        }
        return { status: 502, text: `No se pudo completar la operación (${code ?? "base de datos no disponible"}).` };
    }
    function withCsrf(request, reply) {
        const session = deps.requireSession(request, reply);
        if (!session)
            return null;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            errorPage(request, reply, session, "Relaciones", "Solicitud inválida: vuelve a abrir la página.", 403);
            return null;
        }
        return { session, body };
    }
    const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
    const uuidOf = (value) => (typeof value === "string" && UUID.test(value) ? value : null);
    async function renderDetail(request, reply, session, id, extra = {}) {
        let detail;
        let sanctions = [];
        try {
            detail = await relations.get(id);
            if (detail) {
                const lists = await Promise.all(detail.parties.map((p) => relations.sanctionsForUser(p.userId)));
                sanctions = lists.flat();
            }
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        if (!detail)
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        return deps.html(reply, request, relationCode(detail.relation.number), relationDetailView({
            csrf: session.csrfToken,
            detail,
            sanctions,
            canSanction: can(session.role, "sanctions"),
            canDispute: can(session.role, "disputes"),
            relay: extra.relay,
            flash: extra.flash,
        }), session, extra.status ?? 200);
    }
    app.get("/relations", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = FILTERS.includes(query.f) ? query.f : "abiertas";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            const list = await relations.list(filter, page, lateAfter);
            return deps.html(reply, request, "Relaciones", relationsListView({ filter, page: list, waitingHours: lateAfter }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relaciones", m.text, m.status);
        }
    });
    app.get("/relations/:id", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        return renderDetail(request, reply, session, id);
    });
    /** Registra lo que dijo una parte y devuelve el texto listo para reenviar a la otra. */
    app.post("/relations/:id/message", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const text = str(body.body, 2000);
        if (text.length < 2)
            return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "Escribe el mensaje." }, status: 400 });
        let detail;
        try {
            detail = await relations.get(id);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        if (!detail)
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const parties = detail.parties;
        const fromUserId = uuidOf(body.fromUserId);
        const toUserId = uuidOf(body.toUserId);
        if (fromUserId && !parties.some((p) => p.userId === fromUserId)) {
            return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "Esa persona no es parte del vínculo." }, status: 400 });
        }
        if (toUserId && !parties.some((p) => p.userId === toUserId)) {
            return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "Esa persona no es parte del vínculo." }, status: 400 });
        }
        // Reenviar al destinatario elegido; si no se eligió, al otro lado del vínculo.
        const target = toUserId ? parties.find((p) => p.userId === toUserId) : fromUserId ? counterpart(parties, fromUserId) : null;
        const isNote = !toUserId;
        const relayed = !!target && !isNote && !detail.relation.relayPaused;
        try {
            await relations.addMessage({
                relationshipId: id,
                fromUserId,
                toUserId: isNote ? null : (target?.userId ?? null),
                body: text,
                kind: isNote ? "nota" : "reenvio",
                relayed,
                createdBy: session.userId,
            });
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        await deps.audit("admin.relation.message", session.userId, `${relationCode(detail.relation.number)}: ${isNote ? "nota interna" : relayed ? "mensaje reenviado" : "mensaje registrado sin reenviar"}`);
        if (isNote || !target) {
            return renderDetail(request, reply, session, id, { flash: { kind: "ok", text: "Nota interna guardada: no se reenvía a nadie." } });
        }
        const source = fromUserId ? parties.find((p) => p.userId === fromUserId) : null;
        const relay = {
            to: target.name,
            text: relayMessage({
                fromRole: source?.role ?? "amp",
                fromName: source?.name ?? "AutoMantPro",
                code: relationCode(detail.relation.number),
                subject: detail.relation.subject,
                body: text,
            }),
        };
        const flash = detail.relation.relayPaused
            ? { kind: "error", text: "El reenvío está en pausa: el mensaje quedó registrado pero no lo envíes todavía." }
            : { kind: "ok", text: "Mensaje registrado. Copia el texto y envíalo por WhatsApp." };
        return renderDetail(request, reply, session, id, { relay, flash });
    });
    app.post("/relations/:id/status", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const next = str(body.status, 20);
        const reason = str(body.reason, 191);
        let detail;
        try {
            detail = await relations.get(id);
            if (!detail)
                return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
            if (!canTransition(detail.relation.status, next)) {
                return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "Ese cambio de estado no es posible." }, status: 400 });
            }
            if ((next === "cerrada" || next === "bloqueada") && reason.length < 5) {
                return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "Escribe el motivo: queda registrado y se le comunica a las partes." }, status: 400 });
            }
            const changed = await relations.setStatus(id, detail.relation.status, next, reason || null);
            if (!changed) {
                return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "El vínculo cambió mientras tanto: revisa su estado." }, status: 400 });
            }
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        await deps.audit("admin.relation.status", session.userId, `${relationCode(detail.relation.number)}: ${detail.relation.status} → ${next}${reason ? ` (${reason})` : ""}`);
        return renderDetail(request, reply, session, id, { flash: { kind: "ok", text: "Estado actualizado." } });
    });
    app.post("/relations/:id/relay", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const paused = body.paused === "1";
        try {
            await relations.setRelayPaused(id, paused);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        await deps.audit("admin.relation.relay", session.userId, `Vínculo ${id}: reenvío ${paused ? "en pausa" : "reanudado"}`);
        return renderDetail(request, reply, session, id, {
            flash: { kind: "ok", text: paused ? "Reenvío en pausa: los mensajes se registran pero no se envían." : "Reenvío reanudado." },
        });
    });
    app.post("/relations/:id/consent", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        const userId = uuidOf(body.userId);
        if (!UUID.test(id) || !userId)
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const consent = body.consent === "1";
        try {
            await relations.setConsent(id, userId, consent);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        await deps.audit("admin.relation.consent", session.userId, `Vínculo ${id}: ${consent ? "consentimiento registrado" : "consentimiento retirado"} para compartir contacto`);
        return renderDetail(request, reply, session, id, {
            flash: {
                kind: "ok",
                text: consent ? "Consentimiento registrado: su número puede compartirse en este vínculo." : "Consentimiento retirado: su número vuelve a estar oculto.",
            },
        });
    });
    app.post("/relations/:id/group", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const remove = body.remove === "1";
        const inviteUrl = str(body.inviteUrl, 255);
        let detail;
        try {
            detail = await relations.get(id);
            if (!detail)
                return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
            if (!remove) {
                if (!groupAllowed(detail.parties)) {
                    return renderDetail(request, reply, session, id, {
                        flash: { kind: "error", text: "Falta el consentimiento de alguna parte: sin eso no se aprueba el grupo." },
                        status: 400,
                    });
                }
                if (!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}$/.test(inviteUrl)) {
                    return renderDetail(request, reply, session, id, {
                        flash: { kind: "error", text: "El enlace debe ser una invitación de WhatsApp (https://chat.whatsapp.com/...)." },
                        status: 400,
                    });
                }
            }
            await relations.approveGroup(id, remove ? null : inviteUrl, session.userId);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        await deps.audit("admin.relation.group", session.userId, `${relationCode(detail.relation.number)}: ${remove ? "grupo retirado" : "grupo aprobado con consentimiento de las partes"}`);
        return renderDetail(request, reply, session, id, {
            flash: { kind: "ok", text: remove ? "Volvió a conversación mediada." : "Grupo aprobado y registrado en el vínculo." },
        });
    });
    app.post("/relations/:id/dispute", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Relación", "Vínculo no encontrado.", 404);
        const reason = str(body.reason, 2000);
        const claimantUserId = uuidOf(body.claimantUserId);
        const againstUserId = uuidOf(body.againstUserId);
        if (reason.length < 10) {
            return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "Describe el reclamo con más detalle." }, status: 400 });
        }
        if (claimantUserId && againstUserId && claimantUserId === againstUserId) {
            return renderDetail(request, reply, session, id, { flash: { kind: "error", text: "El reclamo debe ser contra la otra parte." }, status: 400 });
        }
        let disputeId;
        try {
            disputeId = await relations.openDispute({ relationshipId: id, claimantUserId, againstUserId, reason, openedBy: session.userId });
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Relación", m.text, m.status);
        }
        await deps.audit("admin.dispute.open", session.userId, `Disputa ${disputeId} abierta en el vínculo ${id}`);
        return renderDetail(request, reply, session, id, { flash: { kind: "ok", text: "Disputa abierta: el vínculo queda en disputa hasta resolverla." } });
    });
    app.get("/disputes", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = DISPUTE_STATUSES.includes(String(query.f)) ? String(query.f) : "abierta";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            const list = await relations.listDisputes(filter, page);
            return deps.html(reply, request, "Disputas", disputesListView({ csrf: session.csrfToken, filter, page: list, canResolve: can(session.role, "disputes") }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Disputas", m.text, m.status);
        }
    });
    app.post("/disputes/:id/resolve", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Disputas", "Caso no encontrado.", 404);
        const resolution = str(body.resolution, 2000);
        const status = ["resuelta", "rechazada", "en_revision"].includes(String(body.status)) ? String(body.status) : "resuelta";
        if (resolution.length < 10)
            return errorPage(request, reply, session, "Disputas", "Escribe la resolución con más detalle.", 400);
        let dispute;
        try {
            dispute = await relations.getDispute(id);
            if (!dispute)
                return errorPage(request, reply, session, "Disputas", "Caso no encontrado.", 404);
            const changed = await relations.resolveDispute(id, status, resolution, session.userId);
            if (!changed)
                return errorPage(request, reply, session, "Disputas", "El caso ya estaba resuelto.", 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Disputas", m.text, m.status);
        }
        await deps.audit("admin.dispute.resolve", session.userId, `${disputeCode(dispute.number)} → ${status}`);
        return reply.redirect("/admin/disputes?f=todas", 302);
    });
    app.get("/sanctions", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const raw = Number(request.query?.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            const list = await relations.listSanctions(page);
            return deps.html(reply, request, "Sanciones", sanctionsListView({ csrf: session.csrfToken, page: list, canLift: can(session.role, "sanctions") }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Sanciones", m.text, m.status);
        }
    });
    /** Aplica un paso de la escala a una entidad, con motivo obligatorio. */
    app.post("/users/:id/sanctions", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Sanciones", "Usuario no encontrado.", 404);
        const level = sanctionLevel(str(body.level, 30));
        const reason = str(body.reason, 500);
        const relationshipId = uuidOf(body.relationshipId);
        const back = relationshipId ? `/admin/relations/${relationshipId}` : `/admin/users/${id}`;
        if (!level)
            return errorPage(request, reply, session, "Sanciones", "Elige un paso de la escala.", 400);
        if (reason.length < 5)
            return errorPage(request, reply, session, "Sanciones", "Escribe el motivo: se le comunica a la entidad y queda registrado.", 400);
        const rawDays = str(body.days, 6);
        const days = rawDays === "" ? null : Number.isFinite(Number(rawDays)) ? Math.max(0, Math.floor(Number(rawDays))) : null;
        try {
            const history = await relations.sanctionsForUser(id);
            const suggested = nextSanctionLevel(history);
            await relations.addSanction({
                userId: id,
                level: level.key,
                reason,
                relationshipId,
                disputeId: null,
                endsAt: sanctionEnd(level.key, days),
                createdBy: session.userId,
            });
            await deps.audit("admin.sanction.apply", session.userId, `Sanción ${level.key} a ${id}: ${reason}${suggested !== level.key ? ` (el paso sugerido era ${suggested})` : ""}`);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Sanciones", m.text, m.status);
        }
        return reply.redirect(`${back}?ok=sancion`, 302);
    });
    app.post("/sanctions/:id/lift", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Sanciones", "Sanción no encontrada.", 404);
        const reason = str(body.reason, 191);
        if (reason.length < 5)
            return errorPage(request, reply, session, "Sanciones", "Escribe el motivo para levantarla.", 400);
        try {
            const changed = await relations.liftSanction(id, reason, session.userId);
            if (!changed)
                return errorPage(request, reply, session, "Sanciones", "Esa sanción ya no estaba vigente.", 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Sanciones", m.text, m.status);
        }
        await deps.audit("admin.sanction.lift", session.userId, `Sanción ${id} levantada: ${reason}`);
        return reply.redirect("/admin/sanctions?ok=levantada", 302);
    });
}
//# sourceMappingURL=relations.js.map