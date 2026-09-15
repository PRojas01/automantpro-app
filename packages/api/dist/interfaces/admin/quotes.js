import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { parseAmount } from "../../application/work-orders/workflow.js";
import { LOSS_REASONS, MAX_STORES_PER_REQUEST, ORDER_STAGE_TRANSITIONS, quoteRequestCode, } from "../../application/quotes/workflow.js";
import { newQuoteView, quoteDetailView, quotesListView } from "./views-quotes.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = ["abiertas", "con_pedido", "todas"];
const OK_MESSAGES = {
    creada: "Solicitud creada. Envía el mensaje a cada almacén.",
    respuesta: "Respuesta registrada. Actualiza la comparativa del cliente.",
    elegida: "Pedido creado. Envía la confirmación al almacén y al cliente.",
    cerrada: "Solicitud cerrada sin pedido.",
    perdida: "Motivo de pérdida guardado.",
    pedido: "Pedido actualizado. Envía el aviso al cliente.",
};
const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const optional = (value, max) => str(value, max) || null;
const asList = (value) => (value === undefined || value === null ? [] : (Array.isArray(value) ? value : [value]).map(String));
function smallInt(value, min, max) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw)
        return undefined;
    if (!/^\d{1,4}$/.test(raw))
        return null;
    const n = Number(raw);
    return n >= min && n <= max ? n : null;
}
function dbErrorText(err) {
    const code = err.code;
    if (code === "ER_BAD_FIELD_ERROR" || code === "ER_NO_SUCH_TABLE") {
        return { status: 503, text: "La base de datos necesita actualizarse: ve a Ajustes y pulsa «Aplicar actualizaciones»." };
    }
    return { status: 502, text: `No se pudo completar la operación (${code ?? "base de datos no disponible"}).` };
}
export function registerQuoteRoutes(app, deps) {
    const { quotes, registrations, appointments } = deps;
    const errorPage = (request, reply, session, title, text, status) => deps.html(reply, request, title, `<div class="card"><p class="error">${escapeHtml(text)}</p></div>`, session, status);
    function withCsrf(request, reply) {
        const session = deps.requireSession(request, reply);
        if (!session)
            return null;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            errorPage(request, reply, session, "Solicitud inválida", "Solicitud inválida: vuelve a abrir la página.", 403);
            return null;
        }
        return { session, body };
    }
    async function renderRequest(request, reply, session, id, flash, status = 200) {
        let found;
        try {
            found = await quotes.getRequest(id);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotización", m.text, m.status);
        }
        if (!found)
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        return deps.html(reply, request, quoteRequestCode(found.request.number), quoteDetailView({ ...found, csrf: session.csrfToken, flash }), session, status);
    }
    async function record(session, type, userIds, payload) {
        for (const entityId of [...new Set(userIds)]) {
            await appointments.recordEvent({ type, actorUserId: session.userId, entityType: "User", entityId, payload }).catch(() => undefined);
        }
    }
    /** Solicitante, vehículo y ciudad: desde un dueño y su vehículo, o desde una orden de trabajo (el taller pide). */
    async function context(query) {
        const pick = (key) => (typeof query[key] === "string" && UUID.test(query[key]) ? query[key] : null);
        const workOrderId = pick("workOrderId");
        let requesterId = pick("requesterId") ?? pick("ownerId");
        let vehicleId = pick("vehicleId");
        if (workOrderId && deps.workOrders) {
            const found = await deps.workOrders.get(workOrderId);
            if (!found)
                return null;
            requesterId = found.order.shopUserId;
            vehicleId = found.order.vehicleId;
        }
        if (!requesterId)
            return null;
        const requester = await registrations.getUserDetail(requesterId);
        if (!requester || !["dueno", "taller"].includes(String(requester.user.role)))
            return null;
        let vehicle = null;
        if (vehicleId) {
            if (String(requester.user.role) === "dueno") {
                vehicle = requester.vehicles.find((v) => String(v.id) === vehicleId) ?? null;
            }
            else if (workOrderId && deps.workOrders) {
                const found = await deps.workOrders.get(workOrderId);
                const owner = found ? await registrations.getUserDetail(found.order.ownerId) : null;
                vehicle = owner?.vehicles.find((v) => String(v.id) === vehicleId) ?? null;
            }
            if (!vehicle)
                return null;
        }
        const city = String(requester.shop?.city ?? requester.user.city ?? "");
        let stores = await quotes.verifiedStores(city);
        let sameCity = true;
        if (stores.length === 0) {
            stores = await quotes.verifiedStores("");
            sameCity = false;
        }
        return { requester: requester.user, vehicle, workOrderId, city: city || "sin ciudad", stores, sameCity };
    }
    app.get("/quotes", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = FILTERS.includes(query.f) ? query.f : "abiertas";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            return deps.html(reply, request, "Cotizaciones", quotesListView({ filter, page: await quotes.listRequests(filter, page) }), session);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotizaciones", m.text, m.status);
        }
    });
    app.get("/quotes/new", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        try {
            const ctx = await context((request.query ?? {}));
            if (!ctx)
                return errorPage(request, reply, session, "Nueva cotización", "Pide la cotización desde el vehículo de un dueño o desde una orden de trabajo.", 404);
            return deps.html(reply, request, "Nueva cotización", newQuoteView({ csrf: session.csrfToken, ...ctx }), session);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Nueva cotización", m.text, m.status);
        }
    });
    app.post("/quotes", async (request, reply) => {
        const csrfCtx = withCsrf(request, reply);
        if (!csrfCtx)
            return reply;
        const { session, body } = csrfCtx;
        let id;
        let requesterId;
        let storeUserIds = [];
        try {
            const ctx = await context(body);
            if (!ctx)
                return errorPage(request, reply, session, "Nueva cotización", "Pide la cotización desde el vehículo de un dueño o desde una orden de trabajo.", 404);
            const invalid = (error) => deps.html(reply, request, "Nueva cotización", newQuoteView({ csrf: session.csrfToken, ...ctx, values: body, error }), session, 400);
            const partName = str(body.partName, 191);
            if (partName.length < 3)
                return invalid("Describe el repuesto que necesita.");
            const quantity = smallInt(body.quantity, 1, 999);
            if (!quantity)
                return invalid("Cantidad no válida.");
            const storeIds = [...new Set(asList(body.storeIds))];
            if (storeIds.length === 0)
                return invalid("Elige al menos un almacén.");
            if (storeIds.length > MAX_STORES_PER_REQUEST)
                return invalid(`Elige como máximo ${MAX_STORES_PER_REQUEST} almacenes.`);
            const verified = await quotes.verifiedStores("");
            if (!storeIds.every((s) => verified.some((v) => v.id === s)))
                return invalid("Solo se puede pedir a almacenes verificados.");
            requesterId = String(ctx.requester.id);
            id = await quotes.createRequest({
                requesterId,
                vehicleId: ctx.vehicle ? String(ctx.vehicle.id) : null,
                workOrderId: ctx.workOrderId,
                partName,
                partCode: optional(body.partCode, 60),
                quantity,
                city: ctx.city,
                notes: optional(body.notes, 500),
                storeIds,
            });
            const created = await quotes.getRequest(id);
            storeUserIds = created?.quotes.map((q) => q.storeUserId) ?? [];
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Nueva cotización", m.text, m.status);
        }
        await record(session, "quote.requested", [requesterId, ...storeUserIds], { quoteRequestId: id });
        await deps.audit("admin.quote.create", session.userId, `Solicitud de cotización ${id} para el usuario ${requesterId}`);
        return reply.redirect(`/admin/quotes/${id}?ok=creada`, 302);
    });
    app.get("/quotes/:id", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        const ok = request.query?.ok;
        return renderRequest(request, reply, session, id, typeof ok === "string" && OK_MESSAGES[ok] ? { kind: "ok", text: OK_MESSAGES[ok] } : undefined);
    });
    app.post("/quotes/:id/quotes/:quoteId", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id, quoteId } = request.params;
        if (!UUID.test(id) || !UUID.test(quoteId))
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        const fail = (text) => renderRequest(request, reply, session, id, { kind: "error", text }, 400);
        const action = body.action === "sin_stock" ? "sin_stock" : "cotizado";
        let unitPrice = null;
        if (action === "cotizado") {
            unitPrice = parseAmount(body.unitPrice);
            if (unitPrice === null || unitPrice <= 0 || unitPrice > 100_000)
                return fail("Escribe un precio unitario válido.");
        }
        const warrantyDays = smallInt(body.warrantyDays, 0, 3650);
        const validDays = smallInt(body.validDays, 0, 365);
        if (warrantyDays === null)
            return fail("Días de garantía no válidos.");
        if (validDays === null)
            return fail("Días de validez no válidos.");
        try {
            const saved = await quotes.saveQuote(id, quoteId, {
                status: action,
                unitPrice,
                brand: action === "cotizado" ? optional(body.brand, 60) : null,
                availability: action === "cotizado" ? optional(body.availability, 60) : null,
                warrantyDays: action === "cotizado" ? (warrantyDays ?? null) : null,
                deliveryTime: action === "cotizado" ? optional(body.deliveryTime, 60) : null,
                validDays: action === "cotizado" ? (validDays ?? null) : null,
                notes: optional(body.notes, 191),
            });
            if (!saved)
                return fail("La solicitud ya no está abierta o el almacén no fue invitado.");
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotización", m.text, m.status);
        }
        await deps.audit(`admin.quote.${action}`, session.userId, `Respuesta en la solicitud ${id}`);
        return reply.redirect(`/admin/quotes/${id}?ok=respuesta`, 302);
    });
    app.post("/quotes/:id/choose", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        const quoteId = typeof body.quoteId === "string" && UUID.test(body.quoteId) ? body.quoteId : null;
        if (!UUID.test(id) || !quoteId)
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        let orderId;
        let users = [];
        try {
            orderId = await quotes.choose(id, quoteId);
            if (!orderId)
                return renderRequest(request, reply, session, id, { kind: "error", text: "Solo se elige una cotización con precio en una solicitud abierta." }, 400);
            const found = await quotes.getRequest(id);
            users = found?.order ? [found.order.requesterId, found.order.storeUserId] : [];
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotización", m.text, m.status);
        }
        await record(session, "quote.ordered", users, { quoteRequestId: id, orderId, stage: "confirmado" });
        await deps.audit("admin.quote.order", session.userId, `Pedido ${orderId} desde la solicitud ${id}`);
        return reply.redirect(`/admin/quotes/${id}?ok=elegida`, 302);
    });
    app.post("/quotes/:id/close", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        const reason = str(body.reason, 191);
        if (reason.length < 5)
            return renderRequest(request, reply, session, id, { kind: "error", text: "Escribe por qué se cierra sin pedido." }, 400);
        try {
            if (!(await quotes.closeRequest(id, reason))) {
                return renderRequest(request, reply, session, id, { kind: "error", text: "La solicitud ya no está abierta." }, 400);
            }
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotización", m.text, m.status);
        }
        await deps.audit("admin.quote.close", session.userId, `Solicitud ${id} cerrada sin pedido: ${reason}`);
        return reply.redirect(`/admin/quotes/${id}?ok=cerrada`, 302);
    });
    app.post("/quotes/:id/quotes/:quoteId/loss", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id, quoteId } = request.params;
        if (!UUID.test(id) || !UUID.test(quoteId))
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        const reason = LOSS_REASONS.some(([k]) => k === body.reason) ? String(body.reason) : null;
        if (!reason)
            return renderRequest(request, reply, session, id, { kind: "error", text: "Elige un motivo." }, 400);
        try {
            if (!(await quotes.setLossReason(id, quoteId, reason))) {
                return renderRequest(request, reply, session, id, { kind: "error", text: "Solo se registra el motivo de una cotización no elegida." }, 400);
            }
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotización", m.text, m.status);
        }
        return reply.redirect(`/admin/quotes/${id}?ok=perdida`, 302);
    });
    app.post("/quotes/:id/order/stage", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Cotización", "Solicitud no encontrada.", 404);
        const next = String(body.stage ?? "");
        const reason = str(body.reason, 191);
        let order;
        try {
            const found = await quotes.getRequest(id);
            if (!found?.order)
                return renderRequest(request, reply, session, id, { kind: "error", text: "Esta solicitud no tiene pedido." }, 400);
            order = found.order;
            if (!(ORDER_STAGE_TRANSITIONS[order.stage] ?? []).includes(next)) {
                return renderRequest(request, reply, session, id, { kind: "error", text: "Ese cambio de estado del pedido no es posible." }, 400);
            }
            if (next === "cancelado" && reason.length < 5)
                return renderRequest(request, reply, session, id, { kind: "error", text: "Escribe el motivo de la cancelación." }, 400);
            if (!(await quotes.setOrderStage(order.id, order.stage, next, next === "cancelado" ? reason : null))) {
                return renderRequest(request, reply, session, id, { kind: "error", text: "El pedido cambió mientras tanto: revisa su estado." }, 400);
            }
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Cotización", m.text, m.status);
        }
        await record(session, "quote.order_stage", [order.requesterId, order.storeUserId], { quoteRequestId: id, orderId: order.id, stage: next });
        await deps.audit(`admin.order.${next}`, session.userId, `Pedido ${order.id}${reason ? `: ${reason}` : ""}`);
        return reply.redirect(`/admin/quotes/${id}?ok=pedido`, 302);
    });
}
//# sourceMappingURL=quotes.js.map