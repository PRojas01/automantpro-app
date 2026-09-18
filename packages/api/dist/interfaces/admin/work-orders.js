import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { DIAGNOSIS_OUTCOMES, EDITABLE_STATUSES, ITEM_KINDS, WORK_ORDER_TRANSITIONS, historyDescription, parseAmount, workOrderCode, } from "../../application/work-orders/workflow.js";
import { featurePaused } from "../../application/settings/platform.js";
import { newWorkOrderView, workOrderDetailView, workOrdersListView } from "./views-work-orders.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = ["abiertas", "por_aprobar", "en_taller", "cerradas", "todas"];
const OK_MESSAGES = {
    creada: "Orden abierta. Envía al dueño el mensaje de recepción.",
    item: "Presupuesto actualizado.",
    diagnostico: "Diagnóstico guardado.",
    estado: "Estado actualizado. Envía el mensaje al dueño.",
    cerrada: "Orden cerrada y guardada en el historial del vehículo. Envía el resumen al dueño.",
};
const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const optional = (value, max) => str(value, max) || null;
function wholeNumber(value, min, max) {
    const digits = typeof value === "string" ? value.replace(/[.\s,]/g, "") : "";
    if (!/^\d{1,7}$/.test(digits))
        return null;
    const n = Number(digits);
    return n >= min && n <= max ? n : null;
}
function dbErrorText(err) {
    const code = err.code;
    if (code === "ER_BAD_FIELD_ERROR" || code === "ER_NO_SUCH_TABLE") {
        return { status: 503, text: "La base de datos necesita actualizarse: ve a Ajustes y pulsa «Aplicar actualizaciones»." };
    }
    return { status: 502, text: `No se pudo completar la operación (${code ?? "base de datos no disponible"}).` };
}
export function registerWorkOrderRoutes(app, deps) {
    const { workOrders, appointments, registrations } = deps;
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
    async function renderOrder(request, reply, session, id, flash, status = 200) {
        let found;
        try {
            found = await workOrders.get(id);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Orden de trabajo", m.text, m.status);
        }
        if (!found)
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        return deps.html(reply, request, workOrderCode(found.order.number), workOrderDetailView({ ...found, csrf: session.csrfToken, flash }), session, status);
    }
    async function record(session, type, order, extra = {}) {
        const payload = { workOrderId: order.id, code: workOrderCode(order.number), ...extra };
        for (const entityId of [order.ownerId, order.shopUserId]) {
            await appointments.recordEvent({ type, actorUserId: session.userId, entityType: "User", entityId, payload }).catch(() => undefined);
        }
    }
    /** Carga los datos para el formulario de alta: desde un turno o desde un dueño y su vehículo. */
    async function formContext(appointmentId, ownerId, vehicleId) {
        const appointment = appointmentId ? await appointments.getAppointment(appointmentId) : null;
        const owner = appointment?.ownerId ?? ownerId;
        if (!owner)
            return null;
        const detail = await registrations.getUserDetail(owner);
        if (!detail || String(detail.user.role) !== "dueno")
            return null;
        const vehicle = detail.vehicles.find((v) => String(v.id) === (appointment?.vehicleId ?? vehicleId)) ?? null;
        if (!vehicle)
            return null;
        const shops = appointment ? [] : await appointments.verifiedShops("");
        return { detail, vehicle, appointment, shops };
    }
    app.get("/work-orders", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = FILTERS.includes(query.f) ? query.f : "abiertas";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            return deps.html(reply, request, "Órdenes de trabajo", workOrdersListView({ filter, page: await workOrders.list(filter, page) }), session);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Órdenes de trabajo", m.text, m.status);
        }
    });
    app.get("/work-orders/new", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const pick = (key) => (typeof query[key] === "string" && UUID.test(query[key]) ? query[key] : null);
        const appointmentId = pick("appointmentId");
        try {
            if (appointmentId) {
                const existing = await workOrders.findByAppointment(appointmentId);
                if (existing)
                    return reply.redirect(`/admin/work-orders/${existing}`, 302);
            }
            const ctx = await formContext(appointmentId, pick("ownerId"), pick("vehicleId"));
            if (!ctx)
                return errorPage(request, reply, session, "Nueva orden", "Abre la orden desde un turno o desde el vehículo de un dueño registrado.", 404);
            return deps.html(reply, request, "Nueva orden de trabajo", newWorkOrderView({ csrf: session.csrfToken, owner: ctx.detail.user, vehicle: ctx.vehicle, appointment: ctx.appointment, shops: ctx.shops }), session);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Nueva orden", m.text, m.status);
        }
    });
    app.post("/work-orders", async (request, reply) => {
        const ctxCsrf = withCsrf(request, reply);
        if (!ctxCsrf)
            return reply;
        const { session, body } = ctxCsrf;
        const uuid = (key) => (typeof body[key] === "string" && UUID.test(body[key]) ? body[key] : null);
        const appointmentId = uuid("appointmentId");
        let id;
        let order;
        try {
            const ctx = await formContext(appointmentId, uuid("ownerId"), uuid("vehicleId"));
            if (!ctx)
                return errorPage(request, reply, session, "Nueva orden", "Abre la orden desde un turno o desde el vehículo de un dueño registrado.", 404);
            const invalid = (error) => deps.html(reply, request, "Nueva orden de trabajo", newWorkOrderView({ csrf: session.csrfToken, owner: ctx.detail.user, vehicle: ctx.vehicle, appointment: ctx.appointment, shops: ctx.shops, values: body, error }), session, 400);
            let shopId;
            if (ctx.appointment) {
                if (ctx.appointment.status !== "confirmed" && ctx.appointment.status !== "pending") {
                    return invalid("El turno ya no está activo: abre la orden sin cita.");
                }
                const existing = await workOrders.findByAppointment(ctx.appointment.id);
                if (existing)
                    return reply.redirect(`/admin/work-orders/${existing}`, 302);
                shopId = ctx.appointment.shopId;
            }
            else {
                const chosen = uuid("shopId");
                if (!chosen || !ctx.shops.some((s) => s.id === chosen))
                    return invalid("Elige un taller verificado.");
                shopId = chosen;
            }
            const operation = deps.platform ? await deps.platform() : null;
            const paused = operation ? featurePaused(operation, "workorders") : null;
            if (paused)
                return invalid(paused);
            const intakeKm = wholeNumber(body.intakeKm, 0, 2_000_000);
            if (intakeKm === null)
                return invalid("Kilometraje de ingreso no válido.");
            id = await workOrders.create({
                shopId,
                ownerId: String(ctx.detail.user.id),
                vehicleId: String(ctx.vehicle.id),
                appointmentId: ctx.appointment?.id ?? null,
                intakeKm,
                intakeNotes: optional(body.intakeNotes, 1000),
                diagnosis: optional(body.diagnosis, 1000),
            });
            order = (await workOrders.get(id))?.order;
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Nueva orden", m.text, m.status);
        }
        if (order)
            await record(session, "workorder.created", order, { status: "recepcion", shopName: order.shopName });
        if (order) {
            await deps.linker?.fromWorkOrder({
                workOrderId: order.id,
                ownerId: order.ownerId,
                shopUserId: order.shopUserId,
                subject: `${workOrderCode(order.number)} · ${order.vehicleLabel ?? ""}`.trim().slice(0, 191),
                createdBy: session.userId,
            });
        }
        await deps.audit("admin.workorder.create", session.userId, `Orden ${order ? workOrderCode(order.number) : id} abierta`);
        return reply.redirect(`/admin/work-orders/${id}?ok=creada`, 302);
    });
    app.get("/work-orders/:id", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        const ok = request.query?.ok;
        return renderOrder(request, reply, session, id, typeof ok === "string" && OK_MESSAGES[ok] ? { kind: "ok", text: OK_MESSAGES[ok] } : undefined);
    });
    /** Carga la orden para una acción; responde y devuelve null si no existe o no está en un estado editable. */
    async function loadForAction(request, reply, session, id, needsEditable) {
        const found = await workOrders.get(id);
        if (!found) {
            await errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
            return null;
        }
        if (needsEditable && !EDITABLE_STATUSES.includes(found.order.status)) {
            await renderOrder(request, reply, session, id, { kind: "error", text: "El presupuesto solo se edita en recepción o después de un rechazo." }, 400);
            return null;
        }
        return found;
    }
    app.post("/work-orders/:id/items", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        try {
            if (!(await loadForAction(request, reply, session, id, true)))
                return reply;
            const kind = ITEM_KINDS.some(([k]) => k === body.kind) ? String(body.kind) : null;
            const description = str(body.description, 191);
            const quantity = parseAmount(body.quantity);
            const unitPrice = parseAmount(body.unitPrice);
            const fail = (text) => renderOrder(request, reply, session, id, { kind: "error", text }, 400);
            if (!kind)
                return fail("Elige si es repuesto o mano de obra.");
            if (description.length < 2)
                return fail("Escribe la descripción del ítem.");
            if (quantity === null || quantity <= 0 || quantity > 999)
                return fail("Cantidad no válida.");
            if (unitPrice === null || unitPrice > 100_000)
                return fail("Precio unitario no válido.");
            await workOrders.addItem(id, { kind, description, brand: optional(body.brand, 60), partCode: optional(body.partCode, 60), quantity, unitPrice });
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Orden de trabajo", m.text, m.status);
        }
        return reply.redirect(`/admin/work-orders/${id}?ok=item`, 302);
    });
    app.post("/work-orders/:id/items/:itemId/delete", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session } = ctx;
        const { id, itemId } = request.params;
        if (!UUID.test(id) || !UUID.test(itemId))
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        try {
            if (!(await loadForAction(request, reply, session, id, true)))
                return reply;
            await workOrders.removeItem(id, itemId);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Orden de trabajo", m.text, m.status);
        }
        return reply.redirect(`/admin/work-orders/${id}?ok=item`, 302);
    });
    app.post("/work-orders/:id/diagnosis", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        try {
            if (!(await loadForAction(request, reply, session, id, true)))
                return reply;
            await workOrders.updateDiagnosis(id, optional(body.diagnosis, 1000));
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Orden de trabajo", m.text, m.status);
        }
        return reply.redirect(`/admin/work-orders/${id}?ok=diagnostico`, 302);
    });
    app.post("/work-orders/:id/status", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        const next = String(body.status ?? "");
        const reason = str(body.reason, 191);
        let order;
        try {
            const found = await loadForAction(request, reply, session, id, false);
            if (!found)
                return reply;
            order = found.order;
            const fail = (text) => renderOrder(request, reply, session, id, { kind: "error", text }, 400);
            if (next === "cerrada" || !(WORK_ORDER_TRANSITIONS[order.status] ?? []).includes(next))
                return fail("Ese cambio de estado no es posible.");
            if (next === "presupuesto_enviado" && found.items.length === 0)
                return fail("Agrega al menos un ítem antes de enviar el presupuesto.");
            if ((next === "rechazado" || next === "cancelada") && reason.length < 5)
                return fail("Escribe el motivo.");
            const updated = await workOrders.setStatus(id, order.status, next, {
                rejectionReason: next === "rechazado" ? reason : undefined,
                cancelReason: next === "cancelada" ? reason : undefined,
            });
            if (!updated)
                return fail("La orden cambió mientras tanto: revisa su estado actual.");
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Orden de trabajo", m.text, m.status);
        }
        await record(session, "workorder.status", order, { status: next, reason: reason || null });
        await deps.audit(`admin.workorder.${next}`, session.userId, `${workOrderCode(order.number)}${reason ? `: ${reason}` : ""}`);
        return reply.redirect(`/admin/work-orders/${id}?ok=estado`, 302);
    });
    app.post("/work-orders/:id/close", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Orden de trabajo", "Orden no encontrada.", 404);
        let order;
        try {
            const found = await loadForAction(request, reply, session, id, false);
            if (!found)
                return reply;
            order = found.order;
            const fail = (text) => renderOrder(request, reply, session, id, { kind: "error", text }, 400);
            if (!(WORK_ORDER_TRANSITIONS[order.status] ?? []).includes("cerrada"))
                return fail("Solo se cierra una orden en ejecución o esperando repuesto.");
            const exitKm = wholeNumber(body.exitKm, 0, 2_000_000);
            if (exitKm === null)
                return fail("Kilometraje de salida no válido.");
            if (order.intakeKm !== null && exitKm < order.intakeKm)
                return fail("El kilometraje de salida no puede ser menor que el de ingreso.");
            const warrantyDays = wholeNumber(body.warrantyDays, 0, 3650);
            if (warrantyDays === null)
                return fail("Días de garantía no válidos.");
            const diagnosisOutcome = DIAGNOSIS_OUTCOMES.some(([k]) => k === body.diagnosisOutcome) ? String(body.diagnosisOutcome) : "no_aplica";
            const nextService = optional(body.nextService, 191);
            const closed = await workOrders.close(id, {
                exitKm,
                warrantyDays,
                nextService,
                diagnosisOutcome,
                outcomeNote: optional(body.outcomeNote, 191),
                historyDescription: historyDescription({ ...order, warrantyDays, nextService }, found.items),
            });
            if (!closed)
                return fail("La orden cambió mientras tanto: revisa su estado actual.");
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Orden de trabajo", m.text, m.status);
        }
        await record(session, "workorder.status", order, { status: "cerrada" });
        await deps.audit("admin.workorder.cerrada", session.userId, `${workOrderCode(order.number)} cerrada`);
        return reply.redirect(`/admin/work-orders/${id}?ok=cerrada`, 302);
    });
}
//# sourceMappingURL=work-orders.js.map