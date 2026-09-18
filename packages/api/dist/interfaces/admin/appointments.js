import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { findSubservice } from "../../domain/maintenance/index.js";
import { rankShops } from "../../application/appointments/matching.js";
import { ALLOWED_TRANSITIONS, categoriesFor, parseEcDateTime, serviceNames, } from "../../application/appointments/messages.js";
import { planItemsFor } from "../../application/registration/plan-text.js";
import { featurePaused } from "../../application/settings/platform.js";
import { appointmentDetailView, appointmentsListView, scheduleView } from "./views-appointments.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = ["hoy", "proximos", "pendientes", "todos"];
const MAX_AHEAD_MS = 180 * 24 * 60 * 60 * 1000;
const OK_MESSAGES = {
    creado: "Turno solicitado. Envía los mensajes al taller y al dueño.",
    estado: "Estado actualizado. Envía el mensaje al dueño.",
};
const asList = (value) => value === undefined || value === null ? [] : (Array.isArray(value) ? value : [value]).map(String);
const validServices = (ids) => [...new Set(ids)].filter((id) => !!findSubservice(id));
function dbErrorText(err) {
    const code = err.code;
    if (code === "ER_BAD_FIELD_ERROR" || code === "ER_NO_SUCH_TABLE") {
        return { status: 503, text: "La base de datos necesita actualizarse: ve a Ajustes y pulsa «Aplicar actualizaciones»." };
    }
    return { status: 502, text: `No se pudo completar la operación (${code ?? "base de datos no disponible"}).` };
}
export function registerAppointmentRoutes(app, deps) {
    const { appointments, registrations } = deps;
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
    async function renderSchedule(request, reply, session, ownerId, vehicleId, selected, extra = {}) {
        let detail;
        try {
            detail = await registrations.getUserDetail(ownerId);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Agendar turno", m.text, m.status);
        }
        if (!detail || String(detail.user.role) !== "dueno") {
            return errorPage(request, reply, session, "Agendar turno", "Solo se agendan turnos para dueños de vehículo registrados.", 404);
        }
        const vehicle = detail.vehicles.find((v) => String(v.id) === vehicleId) ?? detail.vehicles[0];
        if (!vehicle)
            return errorPage(request, reply, session, "Agendar turno", "El dueño no tiene vehículos registrados.", 400);
        let shops = null;
        let sameCity = true;
        if (selected.length > 0 && extra.search !== false) {
            try {
                let candidates = await appointments.verifiedShops(String(detail.user.city ?? ""));
                if (candidates.length === 0) {
                    candidates = await appointments.verifiedShops("");
                    sameCity = false;
                }
                shops = rankShops(candidates, categoriesFor(selected));
            }
            catch (err) {
                const m = dbErrorText(err);
                return errorPage(request, reply, session, "Agendar turno", m.text, m.status);
            }
        }
        return deps.html(reply, request, "Agendar turno", scheduleView({
            owner: detail.user,
            vehicles: detail.vehicles,
            vehicle,
            items: planItemsFor(vehicle),
            selected,
            shops,
            sameCity,
            csrf: session.csrfToken,
            error: extra.error,
            values: extra.values,
        }), session, extra.status ?? 200);
    }
    app.get("/users/:id/schedule", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Agendar turno", "Usuario no encontrado.", 404);
        const query = (request.query ?? {});
        const vehicleId = typeof query.vehicleId === "string" ? query.vehicleId : undefined;
        return renderSchedule(request, reply, session, id, vehicleId, validServices(asList(query.services)));
    });
    app.post("/appointments", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const ownerId = typeof body.ownerId === "string" && UUID.test(body.ownerId) ? body.ownerId : null;
        if (!ownerId)
            return errorPage(request, reply, session, "Agendar turno", "Usuario no encontrado.", 404);
        const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
        const services = validServices(asList(body.services));
        const shopId = typeof body.shopId === "string" && UUID.test(body.shopId) ? body.shopId : null;
        const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) || null : null;
        const scheduledAt = parseEcDateTime(body.date, body.time);
        const fail = (error, status = 400) => renderSchedule(request, reply, session, ownerId, vehicleId, services, { error, values: body, status });
        const operation = deps.platform ? await deps.platform() : null;
        const paused = operation ? featurePaused(operation, "appointments") : null;
        if (paused)
            return fail(paused);
        if (services.length === 0)
            return fail("Elige al menos un servicio.");
        if (!shopId)
            return fail("Elige un taller.");
        if (!scheduledAt)
            return fail("Fecha u hora no válida.");
        const now = Date.now();
        if (scheduledAt.getTime() < now - 5 * 60 * 1000)
            return fail("La fecha y hora ya pasaron: elige un horario futuro.");
        if (scheduledAt.getTime() > now + MAX_AHEAD_MS)
            return fail("Solo se agendan turnos dentro de los próximos 6 meses.");
        let id;
        let shopName;
        try {
            const detail = await registrations.getUserDetail(ownerId);
            if (!detail || String(detail.user.role) !== "dueno")
                return fail("Solo se agendan turnos para dueños de vehículo registrados.", 404);
            if (!detail.vehicles.some((v) => String(v.id) === vehicleId))
                return fail("El vehículo no pertenece a este dueño.");
            const shop = (await appointments.verifiedShops("")).find((s) => s.id === shopId);
            if (!shop)
                return fail("El taller elegido no está verificado.");
            shopName = shop.name;
            id = await appointments.createAppointment({
                ownerId,
                vehicleId,
                shopId,
                scheduledAt,
                services,
                notes,
                summary: serviceNames(services).join(", ").slice(0, 191),
            });
            const created = await appointments.getAppointment(id);
            const payload = { appointmentId: id, scheduledAt: scheduledAt.toISOString(), shopName };
            const entities = [ownerId, created?.shopUserId].filter((v) => !!v);
            if (created?.shopUserId) {
                await deps.linker?.fromAppointment({
                    appointmentId: id,
                    ownerId,
                    shopUserId: created.shopUserId,
                    subject: serviceNames(services).join(", ").slice(0, 191) || null,
                    createdBy: session.userId,
                });
            }
            for (const entityId of entities) {
                await appointments.recordEvent({ type: "appointment.created", actorUserId: session.userId, entityType: "User", entityId, payload });
            }
        }
        catch (err) {
            const m = dbErrorText(err);
            return fail(m.text, m.status);
        }
        await deps.audit("admin.appointment.create", session.userId, `Turno ${id} en ${shopName} para el usuario ${ownerId}`);
        return reply.redirect(`/admin/appointments/${id}?ok=creado`, 302);
    });
    app.get("/appointments", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = FILTERS.includes(query.f) ? query.f : "proximos";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            return deps.html(reply, request, "Turnos", appointmentsListView({ filter, page: await appointments.listAppointments(filter, page) }), session);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Turnos", m.text, m.status);
        }
    });
    async function renderAppointment(request, reply, session, id, flash, status = 200) {
        let appointment;
        try {
            appointment = await appointments.getAppointment(id);
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Turno", m.text, m.status);
        }
        if (!appointment)
            return errorPage(request, reply, session, "Turno", "Turno no encontrado.", 404);
        const workOrderId = deps.workOrders ? await deps.workOrders.findByAppointment(id).catch(() => null) : null;
        return deps.html(reply, request, "Turno", appointmentDetailView({ appointment, csrf: session.csrfToken, flash, workOrderId }), session, status);
    }
    app.get("/appointments/:id", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Turno", "Turno no encontrado.", 404);
        const ok = request.query?.ok;
        const flash = typeof ok === "string" && OK_MESSAGES[ok] ? { kind: "ok", text: OK_MESSAGES[ok] } : undefined;
        return renderAppointment(request, reply, session, id, flash);
    });
    app.post("/appointments/:id/status", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Turno", "Turno no encontrado.", 404);
        const status = body.status;
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 191) : "";
        try {
            const appointment = await appointments.getAppointment(id);
            if (!appointment)
                return errorPage(request, reply, session, "Turno", "Turno no encontrado.", 404);
            if (!(ALLOWED_TRANSITIONS[appointment.status] ?? []).includes(status) || status === "pending") {
                return renderAppointment(request, reply, session, id, { kind: "error", text: "Ese cambio de estado no es posible." }, 400);
            }
            if (status === "cancelled" && reason.length < 5) {
                return renderAppointment(request, reply, session, id, { kind: "error", text: "Escribe el motivo de la cancelación." }, 400);
            }
            await appointments.setStatus(id, status, status === "cancelled" ? reason : null);
            const payload = { appointmentId: id, status, reason: status === "cancelled" ? reason : null };
            for (const entityId of [appointment.ownerId, appointment.shopUserId]) {
                await appointments.recordEvent({ type: "appointment.status", actorUserId: session.userId, entityType: "User", entityId, payload });
            }
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Turno", m.text, m.status);
        }
        await deps.audit(`admin.appointment.${status}`, session.userId, `Turno ${id}${reason ? `: ${reason}` : ""}`);
        return reply.redirect(`/admin/appointments/${id}?ok=estado`, 302);
    });
    app.post("/users/:id/notes", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Bitácora", "Usuario no encontrado.", 404);
        const content = typeof body.text === "string" ? body.text.trim() : "";
        if (content.length < 2 || content.length > 2000) {
            return errorPage(request, reply, session, "Bitácora", "La nota debe tener entre 2 y 2000 caracteres.", 400);
        }
        const channel = body.channel === "llamada" || body.channel === "otro" ? body.channel : "whatsapp";
        try {
            if (!(await registrations.getUserDetail(id)))
                return errorPage(request, reply, session, "Bitácora", "Usuario no encontrado.", 404);
            await appointments.recordEvent({ type: "operator.note", actorUserId: session.userId, entityType: "User", entityId: id, payload: { text: content, channel } });
        }
        catch (err) {
            const m = dbErrorText(err);
            return errorPage(request, reply, session, "Bitácora", m.text, m.status);
        }
        await deps.audit("admin.note.create", session.userId, `Nota en la bitácora del usuario ${id}`);
        return reply.redirect(`/admin/users/${id}?ok=nota`, 302);
    });
}
//# sourceMappingURL=appointments.js.map