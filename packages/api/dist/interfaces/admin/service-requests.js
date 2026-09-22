import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { CATEGORIES, MAX_SHOPS_PER_REQUEST, parsePrice, rankShopsFor, serviceRequestCode, shopsToInvite, } from "../../application/service-requests/workflow.js";
import { newServiceRequestView, serviceRequestDetailView, serviceRequestsListView } from "./views-service-requests.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = ["abiertas", "sin_respuesta", "cerradas", "todas"];
export function registerServiceRequestRoutes(app, deps) {
    const store = deps.serviceRequests;
    const errorPage = (request, reply, session, text, status) => deps.html(reply, request, "Solicitudes", `<div class="card"><p class="error">${escapeHtml(text)}</p></div>`, session, status);
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
            errorPage(request, reply, session, "Solicitud inválida: vuelve a abrir la página.", 403);
            return null;
        }
        return { session, body };
    }
    const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
    const list = (value) => (Array.isArray(value) ? value.map(String) : typeof value === "string" && value ? [value] : []);
    const whole = (value, max) => {
        const text = str(value, 6);
        if (!text)
            return null;
        const n = Number(text);
        return Number.isFinite(n) && n >= 0 && n <= max ? Math.floor(n) : null;
    };
    async function renderDetail(request, reply, session, id, flash, status = 200) {
        let detail;
        try {
            detail = await store.get(id);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        if (!detail)
            return errorPage(request, reply, session, "Solicitud no encontrada.", 404);
        return deps.html(reply, request, serviceRequestCode(detail.request.number), serviceRequestDetailView({ csrf: session.csrfToken, request: detail.request, offers: detail.offers, flash }), session, status);
    }
    app.get("/service-requests", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = FILTERS.includes(String(query.f)) ? String(query.f) : "abiertas";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            const listado = await store.list(filter, page);
            return deps.html(reply, request, "Solicitudes de especialista", serviceRequestsListView({ filter, items: listado.items }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
    });
    /** Formulario: se arma con los talleres verificados de la ciudad del dueño, ordenados. */
    app.get("/service-requests/new", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const ownerId = typeof query.ownerId === "string" && UUID.test(query.ownerId) ? query.ownerId : null;
        if (!ownerId)
            return errorPage(request, reply, session, "Abre la solicitud desde la ficha de un dueño registrado.", 404);
        try {
            const detail = await deps.registrations.getUserDetail(ownerId);
            if (!detail || String(detail.user.role) !== "dueno") {
                return errorPage(request, reply, session, "Solo se piden especialistas para dueños de vehículo registrados.", 404);
            }
            const city = String(detail.user.city ?? "");
            const category = str(query.category, 40) || CATEGORIES[0]?.id || "";
            let candidatos = await store.candidates(city);
            if (candidatos.length === 0)
                candidatos = await store.candidates("");
            const ranked = shopsToInvite(rankShopsFor(candidatos, category, str(query.zone, 120) || null));
            return deps.html(reply, request, "Nueva solicitud", newServiceRequestView({
                csrf: session.csrfToken,
                owner: { id: ownerId, name: String(detail.user.name ?? ""), city },
                vehicles: detail.vehicles.map((v) => ({ id: String(v.id), label: `${String(v.make)} ${String(v.model)} ${String(v.year)}` })),
                shops: ranked,
                values: { category },
            }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
    });
    app.post("/service-requests", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const ownerId = typeof body.ownerId === "string" && UUID.test(body.ownerId) ? body.ownerId : null;
        if (!ownerId)
            return errorPage(request, reply, session, "Usuario no encontrado.", 404);
        const category = CATEGORIES.some((c) => c.id === str(body.category, 40)) ? str(body.category, 40) : null;
        const description = str(body.description, 1000);
        const zone = str(body.zone, 120) || null;
        const vehicleId = typeof body.vehicleId === "string" && UUID.test(body.vehicleId) ? body.vehicleId : null;
        const shopIds = [...new Set(list(body.shopIds).filter((id) => UUID.test(id)))].slice(0, MAX_SHOPS_PER_REQUEST);
        let id;
        let detail = null;
        try {
            detail = await deps.registrations.getUserDetail(ownerId);
            if (!detail || String(detail.user.role) !== "dueno")
                return errorPage(request, reply, session, "Solo se piden especialistas para dueños registrados.", 404);
            const city = String(detail.user.city ?? "");
            const candidatos = await store.candidates(city);
            const ranked = shopsToInvite(rankShopsFor(candidatos, category ?? "", zone));
            const invalid = (error) => deps.html(reply, request, "Nueva solicitud", newServiceRequestView({
                csrf: session.csrfToken,
                owner: { id: ownerId, name: String(detail?.user.name ?? ""), city },
                vehicles: (detail?.vehicles ?? []).map((v) => ({ id: String(v.id), label: `${String(v.make)} ${String(v.model)} ${String(v.year)}` })),
                shops: ranked,
                values: body,
                error,
            }), session, 400);
            if (!category)
                return invalid("Elige la especialidad que necesita.");
            if (description.length < 10)
                return invalid("Describe con más detalle qué necesita.");
            if (shopIds.length === 0)
                return invalid("Elige al menos un taller al que enviar la solicitud.");
            if (!shopIds.every((shopId) => candidatos.some((c) => c.id === shopId)))
                return invalid("Solo se puede invitar a talleres verificados.");
            id = await store.create({ ownerId, vehicleId, category, description, city: city || null, zone, shopIds, createdBy: session.userId });
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.servicerequest.create", session.userId, `Solicitud ${id} de ${category} para el usuario ${ownerId} a ${shopIds.length} talleres`);
        return reply.redirect(`/admin/service-requests/${id}?ok=creada`, 302);
    });
    app.get("/service-requests/:id", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Solicitud no encontrada.", 404);
        const ok = request.query?.ok;
        const flash = ok === "creada" ? { kind: "ok", text: "Solicitud creada: copia el mensaje y envíalo a cada taller." } : undefined;
        return renderDetail(request, reply, session, id, flash);
    });
    /** Registra lo que respondió un taller. */
    app.post("/service-requests/:id/offers/:offerId", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id, offerId } = request.params;
        if (!UUID.test(id) || !UUID.test(offerId))
            return errorPage(request, reply, session, "Solicitud no encontrada.", 404);
        const sinDisponibilidad = body.action === "sin_disponibilidad";
        const price = sinDisponibilidad ? null : parsePrice(str(body.price, 12));
        if (!sinDisponibilidad && str(body.price, 12) && price === null) {
            return renderDetail(request, reply, session, id, { kind: "error", text: "Precio no válido: escribe por ejemplo 45,50." }, 400);
        }
        try {
            const saved = await store.saveOffer(id, offerId, {
                status: sinDisponibilidad ? "sin_disponibilidad" : "ofertado",
                priceUsd: price,
                durationMin: sinDisponibilidad ? null : whole(body.duration, 2000),
                availability: sinDisponibilidad ? null : str(body.availability, 191) || null,
                warrantyDays: sinDisponibilidad ? null : whole(body.warranty, 3650),
                notes: str(body.notes, 191) || null,
            });
            if (!saved)
                return renderDetail(request, reply, session, id, { kind: "error", text: "La solicitud ya no está abierta." }, 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.servicerequest.offer", session.userId, `Respuesta registrada en la solicitud ${id}`);
        return renderDetail(request, reply, session, id, {
            kind: "ok",
            text: sinDisponibilidad ? "Anotado: ese taller no tiene disponibilidad." : "Respuesta guardada. Copia la comparación y envíasela al dueño.",
        });
    });
    /** El dueño elige un taller: se cierra la solicitud y nace el vínculo dueño ↔ taller. */
    app.post("/service-requests/:id/choose", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        const offerId = typeof body.offerId === "string" && UUID.test(body.offerId) ? body.offerId : null;
        if (!UUID.test(id) || !offerId)
            return errorPage(request, reply, session, "Solicitud no encontrada.", 404);
        let detail;
        try {
            detail = await store.get(id);
            if (!detail)
                return errorPage(request, reply, session, "Solicitud no encontrada.", 404);
            const offer = detail.offers.find((o) => o.id === offerId);
            if (!offer || offer.status !== "ofertado") {
                return renderDetail(request, reply, session, id, { kind: "error", text: "Ese taller todavía no respondió." }, 400);
            }
            const chosen = await store.choose(id, offerId);
            if (!chosen)
                return renderDetail(request, reply, session, id, { kind: "error", text: "La solicitud ya estaba cerrada." }, 400);
            await deps.linker?.fromServiceRequest({
                requestId: id,
                ownerId: detail.request.ownerId,
                shopUserId: offer.shopUserId,
                subject: `${serviceRequestCode(detail.request.number)} · ${detail.request.description.slice(0, 120)}`,
                createdBy: session.userId,
            });
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.servicerequest.choose", session.userId, `${serviceRequestCode(detail.request.number)}: taller elegido`);
        return renderDetail(request, reply, session, id, { kind: "ok", text: "Taller elegido. Agenda el turno desde la ficha del dueño." });
    });
    app.post("/service-requests/:id/close", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Solicitud no encontrada.", 404);
        const reason = str(body.reason, 191);
        if (reason.length < 5)
            return renderDetail(request, reply, session, id, { kind: "error", text: "Escribe el motivo." }, 400);
        try {
            const closed = await store.close(id, reason);
            if (!closed)
                return renderDetail(request, reply, session, id, { kind: "error", text: "La solicitud ya estaba cerrada." }, 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.servicerequest.close", session.userId, `Solicitud ${id} cancelada: ${reason}`);
        return renderDetail(request, reply, session, id, { kind: "ok", text: "Solicitud cancelada." });
    });
}
//# sourceMappingURL=service-requests.js.map