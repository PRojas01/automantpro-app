import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { parseContactInput, pendingTasks, welcomeMessage } from "../../application/attend/welcome.js";
import { attendView } from "./views-attend.js";
export function registerAttendRoutes(app, deps) {
    app.get("/attend", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        return deps.html(reply, request, "Atender", attendView({ csrf: session.csrfToken, query: "" }), session);
    });
    app.post("/attend", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const body = (request.body ?? {});
        if (!verifyCsrf(session, body.csrf)) {
            return deps.html(reply, request, "Atender", `<div class="card"><p class="error">Solicitud inválida: vuelve a abrir la página.</p></div>`, session, 403);
        }
        const query = typeof body.q === "string" ? body.q.slice(0, 2000) : "";
        const { phone, code } = parseContactInput(query);
        let detail = null;
        let appointments = [];
        let events = [];
        try {
            if (phone) {
                const found = await deps.registrations.searchUsers(phone.replace(/\D/g, ""), 1);
                const row = found.items.find((u) => String(u.phone) === phone);
                if (row)
                    detail = await deps.registrations.getUserDetail(String(row.id));
            }
            if (detail && deps.appointments) {
                [appointments, events] = await Promise.all([
                    deps.appointments.listForUser(String(detail.user.id)),
                    deps.appointments.userEvents(String(detail.user.id), 10),
                ]);
            }
        }
        catch (err) {
            const code = err.code ?? "base de datos no disponible";
            return deps.html(reply, request, "Atender", `${attendView({ csrf: session.csrfToken, query })}<div class="card"><p class="error">No se pudo consultar la base de datos (${escapeHtml(code)}).</p></div>`, session, 502);
        }
        let visit = null;
        let visitLookup = false;
        if (code && deps.visits) {
            try {
                visit = await deps.visits.find(code);
                visitLookup = true;
            }
            catch {
                visitLookup = false;
            }
        }
        const ctx = { detail, appointments, events };
        return deps.html(reply, request, "Atender", attendView({
            csrf: session.csrfToken,
            query,
            result: { phone, code, visit, visitLookup, detail, tasks: pendingTasks(ctx), message: welcomeMessage(ctx) },
        }), session);
    });
}
//# sourceMappingURL=attend.js.map