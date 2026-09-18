import { escapeHtml as e } from "../entry/page.js";
import { DATASETS } from "../../infrastructure/data/data-store.js";
import { REQUEST_KINDS, REQUEST_STATUS_LABELS, RESPONSE_DAYS, dataRequestCode, daysLeft, isOverdue, kindLabel, } from "../../application/data/lopdp.js";
// Vistas de exportaciones (docs/35 A4) y solicitudes de la LOPDP (A3).
const flashHtml = (flash) => (flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "");
const csrfField = (csrf) => `<input type="hidden" name="csrf" value="${e(csrf)}">`;
function when(value) {
    if (!value)
        return "—";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeZone: "America/Guayaquil" }).format(date);
}
export function exportsView(input) {
    const rows = DATASETS.map((d) => `<tr><td>${e(d.label)}</td>
    <td>${input.counts ? String(input.counts[d.key] ?? 0) : "—"}</td>
    <td>${d.personal ? '<span class="error">datos personales</span>' : '<span class="muted">sin datos personales</span>'}</td>
    <td><a href="/admin/exports/${e(d.key)}.csv">Descargar CSV</a></td></tr>`).join("");
    return `<div class="stack wide"><h1>Respaldos y exportaciones</h1>${flashHtml(input.flash)}
  <div class="card"><h2>Cómo usarlo</h2>
    <p class="muted">Cada archivo se abre en Excel o en Google Sheets. Guarda los respaldos en un lugar cifrado y bórralos cuando ya no los necesites: los archivos marcados contienen datos personales y su descarga queda en la auditoría.</p>
    <p class="muted">La descarga trae hasta 5.000 filas por archivo, las más recientes primero.</p></div>
  <div class="scroll"><table><thead><tr><th>Conjunto</th><th>Filas</th><th>Contenido</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
const STATUS_FILTERS = [
    ["recibida", "Recibidas"],
    ["en_proceso", "En proceso"],
    ["atendida", "Atendidas"],
    ["rechazada", "Rechazadas"],
    ["todas", "Todas"],
];
export function dataRequestsView(input) {
    const tabs = STATUS_FILTERS.map(([key, label]) => `<a class="${key === input.filter ? "active" : ""}" href="/admin/data-requests?f=${e(key)}">${e(label)}</a>`).join("");
    const rows = input.items
        .map((r) => {
        const left = daysLeft(r.dueAt);
        const plazo = isOverdue(r)
            ? `<span class="error">vencido hace ${Math.abs(left)} días</span>`
            : r.status === "atendida" || r.status === "rechazada"
                ? `<span class="muted">cerrado ${when(r.resolvedAt)}</span>`
                : `<span class="${left <= 3 ? "error" : "muted"}">${left} días</span>`;
        const actions = r.status === "recibida" || r.status === "en_proceso"
            ? `<a href="/admin/data-requests/${e(r.id)}/export.json">Descargar sus datos</a>
            <form method="post" action="/admin/data-requests/${e(r.id)}/resolve">${csrfField(input.csrf)}
            <label for="res-${e(r.id)}">Qué se hizo</label><textarea id="res-${e(r.id)}" name="resolution" rows="2" maxlength="2000" required></textarea>
            <select name="status"><option value="atendida">Atendida</option><option value="en_proceso">En proceso</option><option value="rechazada">Rechazada</option></select>
            <button type="submit">Guardar</button></form>
            ${r.kind === "eliminacion" && !r.anonymizedAt
                ? `<form method="post" action="/admin/data-requests/${e(r.id)}/anonymize">${csrfField(input.csrf)}
                <label for="anon-${e(r.id)}">Confirma escribiendo ANONIMIZAR</label><input id="anon-${e(r.id)}" name="confirm" required>
                <button class="danger" type="submit">Anonimizar sus datos</button></form>`
                : ""}`
            : `<span class="muted">${e(r.resolution ?? "")}</span>`;
        return `<tr><td>${e(dataRequestCode(r.number))}</td>
      <td><a href="/admin/users/${e(r.userId)}">${e(r.userName ?? r.userId)}</a></td>
      <td>${e(kindLabel(r.kind))}${r.anonymizedAt ? '<br><span class="ok">anonimizado</span>' : ""}</td>
      <td>${e(REQUEST_STATUS_LABELS[r.status] ?? r.status)}<br><span class="muted">${e(when(r.createdAt))}</span></td>
      <td>${plazo}</td>
      <td>${actions}</td></tr>`;
    })
        .join("");
    return `<div class="stack wide"><h1>Solicitudes de datos (LOPDP)</h1>${flashHtml(input.flash)}
  <div class="tabs">${tabs}</div>
  <div class="card"><h2>Cómo funciona</h2>
    <p class="muted">El plazo de respuesta es de ${RESPONSE_DAYS} días. «Acceso» entrega una copia de sus datos; «rectificación» se corrige en su ficha; «eliminación» anonimiza sus datos personales y conserva el historial técnico, como exige la retención.</p>
    <ul>${REQUEST_KINDS.map((k) => `<li><strong>${e(k.label)}:</strong> ${e(k.description)}</li>`).join("")}</ul>
    <p class="muted">Las solicitudes se abren desde la ficha del titular.</p></div>
  ${input.items.length === 0 ? `<p class="muted">No hay solicitudes con ese filtro.</p>` : ""}
  <div class="scroll"><table><thead><tr><th>Caso</th><th>Titular</th><th>Tipo</th><th>Estado</th><th>Plazo</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
/** Tarjeta en la ficha del titular: solicitudes propias y alta de una nueva. */
export function userDataRequestsCard(userId, items, csrf) {
    const list = items.length
        ? `<ul>${items
            .map((r) => `<li>${e(dataRequestCode(r.number))} · ${e(kindLabel(r.kind))} · ${e(REQUEST_STATUS_LABELS[r.status] ?? r.status)}${isOverdue(r) ? ' <span class="error">vencido</span>' : ""}</li>`)
            .join("")}</ul>`
        : `<p class="muted">Sin solicitudes de datos.</p>`;
    return `<div class="card"><h2>Solicitudes de datos (LOPDP)</h2>${list}
    <form method="post" action="/admin/data-requests">${csrfField(csrf)}
    <input type="hidden" name="userId" value="${e(userId)}">
    <label for="dr-kind">Tipo de solicitud</label>
    <select id="dr-kind" name="kind">${REQUEST_KINDS.map((k) => `<option value="${e(k.key)}">${e(k.label)} — ${e(k.description)}</option>`).join("")}</select>
    <label for="dr-channel">Cómo la pidió</label><input id="dr-channel" name="channel" maxlength="30" placeholder="WhatsApp">
    <label for="dr-detail">Qué pide exactamente</label><textarea id="dr-detail" name="detail" rows="2" maxlength="1000"></textarea>
    <button type="submit">Registrar solicitud</button></form>
    <p class="muted">Queda con plazo de ${RESPONSE_DAYS} días y se atiende en «Solicitudes de datos».</p></div>`;
}
//# sourceMappingURL=views-data.js.map