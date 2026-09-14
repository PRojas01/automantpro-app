import { randomBytes } from "node:crypto";
import { escapeHtml } from "../entry/page.js";
import { hashPassword } from "../../infrastructure/password.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { CONSENT_VERSION, PERFILES, ownerSchema, shopSchema, storeSchema, vehicleSchema, } from "../../application/registration/schemas.js";
import { planTextFor } from "../../application/registration/plan-text.js";
import { ROLE_LABELS, newUserView, userDetailView, usersListView, verificationsView } from "./views-registrations.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OK_MESSAGES = {
    creado: "Registro creado.",
    vehiculo: "Vehículo agregado.",
    verificado: "Verificación aprobada.",
    rechazado: "Verificación rechazada.",
    nota: "Nota agregada a la bitácora.",
};
function dbError(err) {
    const code = err.code;
    if (code === "ER_DUP_ENTRY")
        return { status: 409, text: "Ya existe un usuario con ese teléfono o correo. Búscalo en Usuarios." };
    if (code === "ER_BAD_FIELD_ERROR" || code === "ER_NO_SUCH_TABLE") {
        return { status: 503, text: "La base de datos necesita actualizarse: ve a Ajustes y pulsa «Aplicar actualizaciones»." };
    }
    return { status: 502, text: `No se pudo completar la operación (${code ?? "base de datos no disponible"}).` };
}
function toVehicle(data) {
    return {
        make: data.make,
        model: data.model,
        year: data.year,
        currentKm: data.currentKm,
        vehicleClass: data.vehicleClass,
        fuel: data.fuel,
        plate: data.plate,
        usageProfile: data.usageProfile,
        remindersOptIn: data.reminders,
    };
}
function flashFrom(request) {
    const ok = request.query?.ok;
    return typeof ok === "string" && OK_MESSAGES[ok] ? { kind: "ok", text: OK_MESSAGES[ok] } : undefined;
}
export function registerRegistrationRoutes(app, deps) {
    const { registrations } = deps;
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
    async function renderDetail(request, reply, session, id, extra = {}) {
        let detail;
        try {
            detail = await registrations.getUserDetail(id);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Usuario", m.text, m.status);
        }
        if (!detail)
            return errorPage(request, reply, session, "Usuario", "Usuario no encontrado.", 404);
        const plans = {};
        for (const vehicle of detail.vehicles)
            plans[String(vehicle.id)] = planTextFor(vehicle);
        let appointmentsList = [];
        let events = [];
        if (deps.appointments) {
            try {
                [appointmentsList, events] = await Promise.all([deps.appointments.listForUser(id), deps.appointments.userEvents(id, 30)]);
            }
            catch {
                // sin turnos ni bitácora si la base no responde: la ficha se muestra igual
            }
        }
        return deps.html(reply, request, String(detail.user.name ?? "Usuario"), userDetailView({ detail, csrf: session.csrfToken, plans, flash: extra.flash, error: extra.error, values: extra.values, appointments: appointmentsList, events }), session, extra.status ?? 200);
    }
    app.get("/users", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const q = typeof query.q === "string" ? query.q.trim().slice(0, 60) : "";
        const raw = Number(query.page ?? 1);
        const page = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
        try {
            return deps.html(reply, request, "Usuarios", usersListView({ query: q, page: await registrations.searchUsers(q, page) }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Usuarios", m.text, m.status);
        }
    });
    app.get("/users/new", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const requested = request.query?.perfil;
        const perfil = PERFILES.includes(requested) ? requested : "dueno";
        return deps.html(reply, request, "Nuevo registro", newUserView({ perfil, csrf: session.csrfToken, values: { consent: "", reminders: "on" } }), session);
    });
    app.post("/users/new", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const perfil = PERFILES.includes(body.perfil) ? body.perfil : "dueno";
        const invalid = (text, status) => deps.html(reply, request, "Nuevo registro", newUserView({ perfil, csrf: session.csrfToken, values: body, error: text }), session, status);
        const userFrom = async (data, keepEmail) => ({
            phone: data.phone,
            name: data.name,
            city: data.city,
            email: keepEmail ? data.email : null,
            source: data.source,
            notes: data.notes,
            consentVersion: CONSENT_VERSION,
            // Las cuentas creadas por el operador no inician sesión con contraseña: se guarda una aleatoria.
            passwordHash: await hashPassword(randomBytes(24).toString("hex")),
        });
        let userId;
        try {
            if (perfil === "dueno") {
                const parsed = ownerSchema.safeParse(body);
                if (!parsed.success)
                    return invalid(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
                userId = await registrations.createOwner(await userFrom(parsed.data, true), toVehicle(parsed.data));
            }
            else if (perfil === "taller") {
                const parsed = shopSchema.safeParse(body);
                if (!parsed.success)
                    return invalid(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
                const d = parsed.data;
                userId = await registrations.createShop(await userFrom(d, false), {
                    name: d.businessName,
                    address: d.address,
                    city: d.city,
                    zone: d.zone,
                    ruc: d.ruc,
                    hours: d.hours,
                    contactName: d.name,
                    email: d.email,
                    services: d.services,
                });
            }
            else {
                const parsed = storeSchema.safeParse(body);
                if (!parsed.success)
                    return invalid(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
                const d = parsed.data;
                userId = await registrations.createStore(await userFrom(d, false), {
                    name: d.businessName,
                    address: d.address,
                    city: d.city,
                    zone: d.zone,
                    ruc: d.ruc,
                    hours: d.hours,
                    contactName: d.name,
                    email: d.email,
                    categories: d.categories,
                    delivery: d.delivery,
                });
            }
        }
        catch (err) {
            const m = dbError(err);
            return invalid(m.text, m.status);
        }
        await deps.audit("admin.user.create", session.userId, `Alta de ${ROLE_LABELS[perfil]} ${userId} desde el panel`);
        return reply.redirect(`/admin/users/${userId}?ok=creado`, 302);
    });
    app.get("/users/:id", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Usuario", "Usuario no encontrado.", 404);
        return renderDetail(request, reply, session, id, { flash: flashFrom(request) });
    });
    app.post("/users/:id/vehicles", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Usuario", "Usuario no encontrado.", 404);
        const parsed = vehicleSchema.safeParse(body);
        if (!parsed.success) {
            return renderDetail(request, reply, session, id, { error: parsed.error.issues[0]?.message ?? "Datos inválidos", values: body, status: 400 });
        }
        try {
            const detail = await registrations.getUserDetail(id);
            if (!detail || String(detail.user.role) !== "dueno") {
                return errorPage(request, reply, session, "Usuario", "Solo se agregan vehículos a dueños registrados.", 400);
            }
            await registrations.addVehicle(id, toVehicle(parsed.data));
        }
        catch (err) {
            const m = dbError(err);
            return renderDetail(request, reply, session, id, { error: m.text, values: body, status: m.status });
        }
        await deps.audit("admin.vehicle.create", session.userId, `Vehículo agregado al usuario ${id}`);
        return reply.redirect(`/admin/users/${id}?ok=vehiculo`, 302);
    });
    app.get("/verifications", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        try {
            return deps.html(reply, request, "Verificaciones", verificationsView({ items: await registrations.pendingVerifications(), flash: flashFrom(request) }), session);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Verificaciones", m.text, m.status);
        }
    });
    app.post("/verifications/:kind/:id", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { kind, id } = request.params;
        if ((kind !== "shop" && kind !== "store") || !UUID.test(id)) {
            return errorPage(request, reply, session, "Verificaciones", "Registro no encontrado.", 404);
        }
        const decision = body.decision === "verified" ? "verified" : body.decision === "rejected" ? "rejected" : null;
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
        const returnTo = typeof body.returnTo === "string" && UUID.test(body.returnTo) ? body.returnTo : null;
        const fail = (text, status) => returnTo
            ? renderDetail(request, reply, session, returnTo, { flash: { kind: "error", text }, status })
            : errorPage(request, reply, session, "Verificaciones", text, status);
        if (!decision)
            return fail("Elige aprobar o rechazar.", 400);
        if (decision === "rejected" && reason.length < 5)
            return fail("Para rechazar escribe la observación que recibirá la entidad.", 400);
        try {
            const updated = await registrations.setVerification(kind, id, decision);
            if (!updated)
                return fail("Registro no encontrado.", 404);
        }
        catch (err) {
            const m = dbError(err);
            return fail(m.text, m.status);
        }
        const label = kind === "shop" ? "Taller" : "Almacén";
        await deps.audit(`admin.verification.${decision}`, session.userId, `${label} ${id}: ${reason || "sin observaciones"}`);
        const ok = decision === "verified" ? "verificado" : "rechazado";
        return reply.redirect(returnTo ? `/admin/users/${returnTo}?ok=${ok}` : `/admin/verifications?ok=${ok}`, 302);
    });
}
//# sourceMappingURL=registrations.js.map