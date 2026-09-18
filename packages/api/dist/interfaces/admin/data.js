import { escapeHtml } from "../entry/page.js";
import { verifyCsrf } from "../../application/admin/security.js";
import { csvFileName, toCsv } from "../../application/data/csv.js";
import { REQUEST_KINDS, dataRequestCode, kindLabel } from "../../application/data/lopdp.js";
import { DATASETS } from "../../infrastructure/data/data-store.js";
import { dataRequestsView, exportsView } from "./views-data.js";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["recibida", "en_proceso", "atendida", "rechazada", "todas"];
export function registerDataRoutes(app, deps) {
    const { data } = deps;
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
            errorPage(request, reply, session, "Datos", "Solicitud inválida: vuelve a abrir la página.", 403);
            return null;
        }
        return { session, body };
    }
    const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
    async function renderRequests(request, reply, session, filter, flash, status = 200) {
        try {
            const list = await data.listRequests(filter, 1);
            return deps.html(reply, request, "Solicitudes de datos", dataRequestsView({ csrf: session.csrfToken, filter, items: list.items, flash }), session, status);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Solicitudes de datos", m.text, m.status);
        }
    }
    app.get("/exports", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        let counts = {};
        try {
            for (const dataset of DATASETS) {
                counts[dataset.key] = (await data.exportRows(dataset.key)).length;
            }
        }
        catch {
            counts = null;
        }
        return deps.html(reply, request, "Respaldos", exportsView({ counts }), session);
    });
    app.get("/exports/:dataset.csv", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const raw = String(request.params.dataset ?? "");
        const dataset = DATASETS.find((d) => d.key === raw);
        if (!dataset)
            return errorPage(request, reply, session, "Respaldos", "Ese conjunto no existe.", 404);
        let rows;
        try {
            rows = await data.exportRows(dataset.key);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Respaldos", m.text, m.status);
        }
        await deps.audit("admin.export.download", session.userId, `Exportó ${dataset.label} (${rows.length} filas${dataset.personal ? ", con datos personales" : ""})`);
        return reply
            .header("Content-Type", "text/csv; charset=utf-8")
            .header("Content-Disposition", `attachment; filename="${csvFileName(dataset.key)}"`)
            .header("Cache-Control", "no-store")
            .send(toCsv(dataset.columns, rows));
    });
    app.get("/data-requests", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const query = (request.query ?? {});
        const filter = STATUSES.includes(String(query.f)) ? String(query.f) : "recibida";
        return renderRequests(request, reply, session, filter);
    });
    app.post("/data-requests", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const userId = typeof body.userId === "string" && UUID.test(body.userId) ? body.userId : null;
        const kind = REQUEST_KINDS.find((k) => k.key === str(body.kind, 20))?.key;
        if (!userId)
            return errorPage(request, reply, session, "Solicitudes de datos", "Titular no encontrado.", 404);
        if (!kind)
            return errorPage(request, reply, session, "Solicitudes de datos", "Elige el tipo de solicitud.", 400);
        let id;
        try {
            id = await data.createRequest({ userId, kind, channel: str(body.channel, 30) || null, detail: str(body.detail, 1000) || null, createdBy: session.userId });
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Solicitudes de datos", m.text, m.status);
        }
        await deps.audit("admin.lopdp.create", session.userId, `Solicitud de ${kindLabel(kind)} del titular ${userId} (${id})`);
        return reply.redirect(`/admin/users/${userId}?ok=lopdp`, 302);
    });
    /** Copia de los datos del titular (derecho de acceso). Queda registrada en la auditoría. */
    app.get("/data-requests/:id/export.json", async (request, reply) => {
        const session = deps.requireSession(request, reply);
        if (!session)
            return reply;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Solicitudes de datos", "Caso no encontrado.", 404);
        let payload;
        let requestRow;
        try {
            requestRow = await data.getRequest(id);
            if (!requestRow)
                return errorPage(request, reply, session, "Solicitudes de datos", "Caso no encontrado.", 404);
            payload = await data.personalExport(requestRow.userId);
            if (!payload)
                return errorPage(request, reply, session, "Solicitudes de datos", "El titular ya no existe.", 404);
            await data.markExported(id);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Solicitudes de datos", m.text, m.status);
        }
        await deps.audit("admin.lopdp.export", session.userId, `Copia de datos entregada en ${dataRequestCode(requestRow.number)}`);
        return reply
            .header("Content-Type", "application/json; charset=utf-8")
            .header("Content-Disposition", `attachment; filename="${dataRequestCode(requestRow.number)}.json"`)
            .header("Cache-Control", "no-store")
            .send(JSON.stringify({ caso: dataRequestCode(requestRow.number), tipo: requestRow.kind, entregado: new Date().toISOString(), datos: payload }, null, 2));
    });
    app.post("/data-requests/:id/resolve", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Solicitudes de datos", "Caso no encontrado.", 404);
        const resolution = str(body.resolution, 2000);
        const next = (["atendida", "en_proceso", "rechazada"].includes(String(body.status)) ? String(body.status) : "atendida");
        if (resolution.length < 10)
            return renderRequests(request, reply, session, "recibida", { kind: "error", text: "Escribe qué se hizo con la solicitud." }, 400);
        let requestRow;
        try {
            requestRow = await data.getRequest(id);
            if (!requestRow)
                return errorPage(request, reply, session, "Solicitudes de datos", "Caso no encontrado.", 404);
            const changed = await data.setStatus(id, next, resolution, session.userId);
            if (!changed)
                return renderRequests(request, reply, session, "todas", { kind: "error", text: "Ese caso ya estaba cerrado." }, 400);
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Solicitudes de datos", m.text, m.status);
        }
        await deps.audit("admin.lopdp.resolve", session.userId, `${dataRequestCode(requestRow.number)} → ${next}`);
        return renderRequests(request, reply, session, "todas", { kind: "ok", text: "Solicitud actualizada." });
    });
    /** Eliminación: anonimiza los datos personales y conserva el historial (docs/35 §5). */
    app.post("/data-requests/:id/anonymize", async (request, reply) => {
        const ctx = withCsrf(request, reply);
        if (!ctx)
            return reply;
        const { session, body } = ctx;
        const { id } = request.params;
        if (!UUID.test(id))
            return errorPage(request, reply, session, "Solicitudes de datos", "Caso no encontrado.", 404);
        if (str(body.confirm, 20).toUpperCase() !== "ANONIMIZAR") {
            return renderRequests(request, reply, session, "recibida", { kind: "error", text: "Para anonimizar hay que escribir ANONIMIZAR: es un cambio que no se deshace." }, 400);
        }
        let requestRow;
        try {
            requestRow = await data.getRequest(id);
            if (!requestRow)
                return errorPage(request, reply, session, "Solicitudes de datos", "Caso no encontrado.", 404);
            if (requestRow.kind !== "eliminacion") {
                return renderRequests(request, reply, session, "recibida", { kind: "error", text: "Solo se anonimiza en una solicitud de eliminación." }, 400);
            }
            const done = await data.anonymizeUser(requestRow.userId, id);
            if (!done) {
                return renderRequests(request, reply, session, "todas", { kind: "error", text: "No se pudo anonimizar: revisa si el titular ya estaba dado de baja." }, 400);
            }
        }
        catch (err) {
            const m = dbError(err);
            return errorPage(request, reply, session, "Solicitudes de datos", m.text, m.status);
        }
        await deps.audit("admin.lopdp.anonymize", session.userId, `Datos personales anonimizados en ${dataRequestCode(requestRow.number)}`);
        return renderRequests(request, reply, session, "todas", {
            kind: "ok",
            text: "Datos personales anonimizados. El historial técnico se conserva sin identificar a la persona.",
        });
    });
}
//# sourceMappingURL=data.js.map