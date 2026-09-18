import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { can } from "../../application/admin/permissions.js";
import { PLAN_LABELS, parseAmount, subscriptionCode } from "../../application/plans/plans.js";
import { plansListView } from "./views-plans.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = ["pendiente", "activa", "por_vencer", "vencida", "todas"];
const PLANS = ["premium", "prueba"];
export function registerPlanRoutes(app, deps) {
    const { plans } = deps;
    const errorPage = (request, reply, session, text, status) => deps.html(reply, request, "Planes", `<div class="card"><p class="error">${escapeHtml(text)}</p></div>`, session, status);
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
    const whole = (value, max) => {
        const text = str(value, 6);
        if (!text)
            return null;
        const n = Number(text);
        return Number.isFinite(n) && n >= 1 && n <= max ? Math.floor(n) : null;
    };
    async function render(request, reply, session, filter, flash, status = 200) {
        try {
            // Las vencidas se marcan al abrir la bandeja: así el estado siempre refleja la fecha.
            await plans.expireDue().catch(() => 0);
            const [list, pending] = await Promise.all([plans.list(filter, 1), plans.pendingCount().catch(() => 0)]);
            return deps.html(reply, request, "Planes y pagos", plansListView({ csrf: session.csrfToken, filter, items: list.items, canDecide: can(session.role, "plans"), pending, flash }), session, status);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
    }
    app.get("/plans", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = FILTERS.includes(String(query.f)) ? String(query.f) : "pendiente";
        return render(request, reply, session, filter);
    });
    /** Registra un pago recibido; queda pendiente hasta que un administrador lo verifique. */
    app.post("/users/:id/subscriptions", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Usuario no encontrado.", 404);
        const plan = PLANS.includes(str(body.plan, 20)) ? str(body.plan, 20) : null;
        if (!plan)
            return errorPage(request, reply, session, "Elige el plan.", 400);
        const months = whole(body.months, 36);
        const rawAmount = str(body.amount, 12);
        const amount = rawAmount ? parseAmount(rawAmount) : null;
        if (rawAmount && amount === null)
            return errorPage(request, reply, session, "Monto no válido: escribe por ejemplo 9,99.", 400);
        try {
            const subId = await plans.create({
                userId: id,
                plan,
                months,
                amountUsd: amount,
                method: str(body.method, 20) || null,
                reference: str(body.reference, 191) || null,
                notes: str(body.notes, 500) || null,
                createdBy: session.userId,
            });
            await deps.audit("admin.plan.registered", session.userId, `Pago registrado para ${id}: ${plan}${amount === null ? "" : ` US$ ${amount.toFixed(2)}`} (${subId})`);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        return reply.redirect(`/admin/users/${id}?ok=plan`, 302);
    });
    app.post("/subscriptions/:id/verify", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Suscripción no encontrada.", 404);
        let sub;
        try {
            sub = await plans.get(id);
            if (!sub)
                return errorPage(request, reply, session, "Suscripción no encontrada.", 404);
            const months = whole(body.months, 36) ?? sub.months;
            const changed = await plans.verify(id, months, session.userId);
            if (!changed)
                return render(request, reply, session, "todas", { kind: "error", text: "Ese pago ya estaba verificado o rechazado." }, 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.plan.verified", session.userId, `${subscriptionCode(sub.number)} verificada: ${PLAN_LABELS[sub.plan] ?? sub.plan} para ${sub.userId}`);
        return render(request, reply, session, "activa", { kind: "ok", text: "Pago verificado: el plan quedó activo." });
    });
    app.post("/subscriptions/:id/reject", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Suscripción no encontrada.", 404);
        const reason = str(body.reason, 191);
        if (reason.length < 5)
            return render(request, reply, session, "pendiente", { kind: "error", text: "Escribe el motivo del rechazo: se le comunica al titular." }, 400);
        let sub;
        try {
            sub = await plans.get(id);
            if (!sub)
                return errorPage(request, reply, session, "Suscripción no encontrada.", 404);
            const changed = await plans.reject(id, reason, session.userId);
            if (!changed)
                return render(request, reply, session, "todas", { kind: "error", text: "Ese pago ya estaba decidido." }, 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.plan.rejected", session.userId, `${subscriptionCode(sub.number)} rechazada: ${reason}`);
        return render(request, reply, session, "pendiente", { kind: "ok", text: "Pago rechazado. Avísale al titular con el motivo." });
    });
    app.post("/subscriptions/:id/cancel", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Suscripción no encontrada.", 404);
        const reason = str(body.reason, 191);
        if (reason.length < 5)
            return render(request, reply, session, "activa", { kind: "error", text: "Escribe el motivo de la baja." }, 400);
        let sub;
        try {
            sub = await plans.get(id);
            if (!sub)
                return errorPage(request, reply, session, "Suscripción no encontrada.", 404);
            const changed = await plans.cancel(id, reason, session.userId);
            if (!changed)
                return render(request, reply, session, "todas", { kind: "error", text: "Esa suscripción ya no estaba activa." }, 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, m.text, m.status);
        }
        await deps.audit("admin.plan.cancelled", session.userId, `${subscriptionCode(sub.number)} dada de baja: ${reason}`);
        return render(request, reply, session, "activa", { kind: "ok", text: "Suscripción dada de baja." });
    });
}
//# sourceMappingURL=plans.js.map