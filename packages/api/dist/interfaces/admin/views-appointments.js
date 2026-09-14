import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { ALLOWED_TRANSITIONS, STATUS_LABELS, formatEcDateTime, ownerMessage, selectionSummary, serviceNames, shopListMessage, shopRequestMessage, } from "../../application/appointments/messages.js";
const e = (value) => escapeHtml(value === null || value === undefined ? "" : String(value));
const csrfField = (token) => `<input type="hidden" name="csrf" value="${e(token)}">`;
const flashHtml = (flash) => flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "";
const FILTERS = [
    ["hoy", "Hoy"],
    ["proximos", "Próximos"],
    ["pendientes", "Por confirmar"],
    ["todos", "Todos"],
];
const PLAN_STATUS = { vencido: "🔴 Vencido", proximo: "🟡 Próximo", al_dia: "🟢 Al día" };
function chatLink(phone, label) {
    const raw = String(phone ?? "");
    const digits = raw.replace(/\D/g, "");
    if (!raw.startsWith("+") || digits.length < 8)
        return "";
    return `<a href="https://wa.me/${e(digits)}" target="_blank" rel="noopener">${e(label)} (${e(formatWhatsappNumber(digits))})</a>`;
}
function copyBox(id, label, content, rows = 8) {
    return `<label for="${id}">${e(label)}</label><textarea id="${id}" readonly rows="${rows}">${e(content)}</textarea>`;
}
const servicesLabel = (a) => serviceNames(a.services).join(", ") || a.summary || "—";
export function appointmentsListView(input) {
    const tabs = FILTERS.map(([id, label]) => `<a href="/admin/appointments?f=${id}"${id === input.filter ? ' class="active"' : ""}>${e(label)}</a>`).join("");
    const body = input.page.items.length === 0
        ? `<tr><td colspan="6" class="muted">Sin turnos</td></tr>`
        : input.page.items
            .map((a) => `<tr><td><a href="/admin/appointments/${e(a.id)}">${e(formatEcDateTime(a.scheduledAt))}</a></td><td>${e(STATUS_LABELS[a.status] ?? a.status)}</td>
            <td>${e(a.shopName)}</td><td><a href="/admin/users/${e(a.ownerId)}">${e(a.ownerName)}</a></td><td>${e(a.vehicleLabel)}</td><td>${e(servicesLabel(a))}</td></tr>`)
            .join("");
    const prev = input.page.page > 1 ? `<a href="/admin/appointments?f=${input.filter}&amp;page=${input.page.page - 1}">← Anterior</a>` : "";
    const next = input.page.items.length === input.page.pageSize
        ? `<a href="/admin/appointments?f=${input.filter}&amp;page=${input.page.page + 1}">Siguiente →</a>`
        : "";
    return `<h1>Turnos</h1>${flashHtml(input.flash)}<div class="tabs">${tabs}</div>
  <p class="muted">Para agendar, abre la ficha de un dueño y pulsa «Agendar turno» en su vehículo.</p>
  <div class="scroll"><table><thead><tr><th>Fecha (hora de Ecuador)</th><th>Estado</th><th>Taller</th><th>Dueño</th><th>Vehículo</th><th>Servicios</th></tr></thead><tbody>${body}</tbody></table></div>
  <div class="pager">${prev}${next}</div>`;
}
export function appointmentDetailView(input) {
    const a = input.appointment;
    const transitions = ALLOWED_TRANSITIONS[a.status] ?? [];
    const actions = [];
    if (transitions.includes("confirmed")) {
        actions.push(`<form method="post" action="/admin/appointments/${e(a.id)}/status">${csrfField(input.csrf)}<input type="hidden" name="status" value="confirmed"><button type="submit">Confirmar turno</button></form>`);
    }
    if (transitions.includes("completed")) {
        actions.push(`<form method="post" action="/admin/appointments/${e(a.id)}/status">${csrfField(input.csrf)}<input type="hidden" name="status" value="completed"><button type="submit">Marcar como completado</button></form>`);
    }
    if (transitions.includes("cancelled")) {
        actions.push(`<form method="post" action="/admin/appointments/${e(a.id)}/status">${csrfField(input.csrf)}<input type="hidden" name="status" value="cancelled">
      <label for="reason">Motivo de la cancelación</label><input id="reason" name="reason" maxlength="191" required>
      <button class="danger" type="submit">Cancelar turno</button></form>`);
    }
    const shopMessage = a.status === "pending" ? copyBox("msg-shop", "Mensaje para el taller", shopRequestMessage(a)) : "";
    return `<div class="stack wide"><p><a href="/admin/appointments">← Turnos</a></p>
  <h1>Turno · ${e(formatEcDateTime(a.scheduledAt))}</h1>${flashHtml(input.flash)}
  <div class="card"><h2>Resumen</h2>
    <div>Estado: <strong>${e(STATUS_LABELS[a.status] ?? a.status)}</strong>${a.cancelReason ? ` · ${e(a.cancelReason)}` : ""}</div>
    <div>Taller: <strong>${e(a.shopName)}</strong> · ${e(a.shopAddress)}, ${e(a.shopCity)}</div>
    <div>Dueño: <a href="/admin/users/${e(a.ownerId)}">${e(a.ownerName)}</a></div>
    <div>Vehículo: ${e(a.vehicleLabel)}${a.plate ? ` · ${e(a.plate)}` : ""}</div>
    <div>Servicios: ${e(servicesLabel(a))}</div>
    ${a.notes ? `<div>Notas: ${e(a.notes)}</div>` : ""}
  </div>
  <div class="card"><h2>Mensajes para enviar por WhatsApp</h2>
    ${shopMessage}
    ${copyBox("msg-owner", "Mensaje para el dueño", ownerMessage(a))}
    <p class="row">${chatLink(a.shopPhone, "Abrir chat del taller")} ${chatLink(a.ownerPhone, "Abrir chat del dueño")}</p>
  </div>
  ${actions.length > 0 ? `<div class="card"><h2>Cambiar estado</h2>${actions.join("")}</div>` : ""}
  </div>`;
}
export function scheduleView(input) {
    const ownerId = e(input.owner.id);
    const vehicleId = e(input.vehicle.id);
    const values = input.values ?? {};
    const vehicleTabs = input.vehicles.length > 1
        ? `<div class="tabs">${input.vehicles
            .map((v) => `<a href="/admin/users/${ownerId}/schedule?vehicleId=${e(v.id)}"${String(v.id) === String(input.vehicle.id) ? ' class="active"' : ""}>${e(v.make)} ${e(v.model)}</a>`)
            .join("")}</div>`
        : "";
    const defaults = input.items.filter((i) => i.status !== "al_dia").map((i) => i.serviceId);
    const checked = input.selected.length > 0 ? input.selected : defaults;
    const itemChecks = input.items.length === 0
        ? `<p class="muted">Este vehículo no tiene plan (faltan clase o combustible).</p>`
        : `<div class="checks">${input.items
            .map((i) => `<label><input type="checkbox" name="services" value="${e(i.serviceId)}"${checked.includes(i.serviceId) ? " checked" : ""}> ${e(i.serviceName)} <span class="muted">· ${e(PLAN_STATUS[i.status] ?? i.status)}</span></label>`)
            .join("")}</div>`;
    let results = "";
    if (input.shops !== null) {
        const summary = copyBox("msg-selection", "Resumen de servicios para el dueño", selectionSummary(input.selected), 6);
        if (input.shops.length === 0) {
            results = `<div class="card"><h2>Talleres</h2>${summary}<p class="error">No hay talleres verificados que ofrezcan estos servicios.</p></div>`;
        }
        else {
            const notice = input.sameCity ? "" : `<p class="muted">No hay talleres verificados en ${e(input.owner.city ?? "su ciudad")}; se muestran los de otras ciudades.</p>`;
            const hidden = input.selected.map((id) => `<input type="hidden" name="services" value="${e(id)}">`).join("");
            const options = input.shops
                .map((shop, i) => `<label class="choice"><input type="radio" name="shopId" value="${e(shop.id)}"${String(values.shopId ?? "") === shop.id || (i === 0 && !values.shopId) ? " checked" : ""} required>
          <span><strong>${e(shop.name)}</strong> · ${e(shop.city)}${shop.zone ? ` (${e(shop.zone)})` : ""}<br><span class="muted">${shop.covered === shop.needed ? "Cubre todo" : `Cubre ${shop.covered} de ${shop.needed}`}${shop.hours ? ` · ${e(shop.hours)}` : ""}</span></span></label>`)
                .join("");
            results = `<div class="card"><h2>Talleres</h2>${notice}${summary}
        ${copyBox("msg-shops", "Lista de talleres para el dueño", shopListMessage(input.shops))}
        <form method="post" action="/admin/appointments">${csrfField(input.csrf)}
        <input type="hidden" name="ownerId" value="${ownerId}"><input type="hidden" name="vehicleId" value="${vehicleId}">${hidden}
        ${options}
        <div class="row"><span><label for="date">Día</label><input id="date" name="date" type="date" value="${e(values.date)}" required></span>
        <span><label for="time">Hora (Ecuador)</label><input id="time" name="time" type="time" value="${e(values.time)}" required></span></div>
        <label for="notes">Notas para el taller (opcional)</label><textarea id="notes" name="notes" maxlength="500" rows="2">${e(values.notes)}</textarea>
        <button class="full" type="submit">Solicitar turno</button></form></div>`;
        }
    }
    return `<div class="stack wide"><p><a href="/admin/users/${ownerId}">← ${e(input.owner.name)}</a></p>
  <h1>Agendar turno</h1>${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}${vehicleTabs}
  <div class="card"><h2>${e(input.vehicle.make)} ${e(input.vehicle.model)} ${e(input.vehicle.year)} · ¿Qué servicios?</h2>
    <form method="get" action="/admin/users/${ownerId}/schedule"><input type="hidden" name="vehicleId" value="${vehicleId}">
    ${itemChecks}<button type="submit">Buscar talleres</button></form></div>
  ${results}</div>`;
}
export function userAppointmentsSection(appointments) {
    if (appointments.length === 0)
        return "";
    const items = appointments
        .map((a) => `<div><a href="/admin/appointments/${e(a.id)}">${e(formatEcDateTime(a.scheduledAt))}</a> · ${e(STATUS_LABELS[a.status] ?? a.status)} · ${e(a.shopName)} · ${e(a.vehicleLabel)}</div>`)
        .join("");
    return `<div class="card"><h2>Turnos</h2>${items}</div>`;
}
function eventText(event) {
    const p = event.payload;
    switch (event.type) {
        case "operator.note":
            return `📝 ${String(p.text ?? "")}${p.channel && p.channel !== "whatsapp" ? ` (${String(p.channel)})` : ""}`;
        case "appointment.created":
            return `📅 Turno solicitado en ${String(p.shopName ?? "un taller")} para ${formatEcDateTime(p.scheduledAt)}`;
        case "appointment.status":
            return `🔄 Turno ${String(STATUS_LABELS[String(p.status)] ?? p.status).toLowerCase()}${p.reason ? `: ${String(p.reason)}` : ""}`;
        default:
            return event.type;
    }
}
export function bitacoraSection(userId, events, csrf) {
    const list = events.length === 0
        ? `<p class="muted">Sin actividad registrada.</p>`
        : events.map((ev) => `<div><span class="muted">${e(formatEcDateTime(ev.createdAt))}</span> · ${e(eventText(ev))}</div>`).join("");
    return `<div class="card"><h2>Bitácora</h2>
    <form method="post" action="/admin/users/${e(userId)}/notes">${csrfField(csrf)}
    <label for="note-text">Nueva nota (qué se conversó o acordó)</label><textarea id="note-text" name="text" maxlength="2000" rows="3" required></textarea>
    <label for="note-channel">Canal</label><select id="note-channel" name="channel"><option value="whatsapp">WhatsApp</option><option value="llamada">Llamada</option><option value="otro">Otro</option></select>
    <button type="submit">Agregar nota</button></form>
    ${list}</div>`;
}
//# sourceMappingURL=views-appointments.js.map