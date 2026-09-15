import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { formatEcDateTime } from "../../application/appointments/messages.js";
import { DIAGNOSIS_OUTCOMES, EDITABLE_STATUSES, ITEM_KINDS, WORK_ORDER_LABELS, WORK_ORDER_TRANSITIONS, formatUsd, lineTotal, ownerWorkOrderMessage, shopWorkOrderMessage, workOrderCode, } from "../../application/work-orders/workflow.js";
const e = (value) => escapeHtml(value === null || value === undefined ? "" : String(value));
const csrfField = (token) => `<input type="hidden" name="csrf" value="${e(token)}">`;
const flashHtml = (flash) => flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "";
const km = (value) => `${Number(value ?? 0).toLocaleString("es-EC")} km`;
const FILTERS = [
    ["abiertas", "Abiertas"],
    ["por_aprobar", "Por aprobar"],
    ["en_taller", "En el taller"],
    ["cerradas", "Cerradas"],
    ["todas", "Todas"],
];
function chatLink(phone, label) {
    const digits = phone.replace(/\D/g, "");
    if (!phone.startsWith("+") || digits.length < 8)
        return "";
    return `<a href="https://wa.me/${e(digits)}" target="_blank" rel="noopener">${e(label)} (${e(formatWhatsappNumber(digits))})</a>`;
}
function copyBox(id, label, content, rows = 9) {
    return `<label for="${id}">${e(label)}</label><textarea id="${id}" readonly rows="${rows}">${e(content)}</textarea>`;
}
export function workOrdersListView(input) {
    const tabs = FILTERS.map(([id, label]) => `<a href="/admin/work-orders?f=${id}"${id === input.filter ? ' class="active"' : ""}>${e(label)}</a>`).join("");
    const body = input.page.items.length === 0
        ? `<tr><td colspan="6" class="muted">Sin órdenes</td></tr>`
        : input.page.items
            .map((o) => `<tr><td><a href="/admin/work-orders/${e(o.id)}">${e(workOrderCode(o.number))}</a></td><td>${e(WORK_ORDER_LABELS[o.status] ?? o.status)}</td>
            <td>${e(o.shopName)}</td><td><a href="/admin/users/${e(o.ownerId)}">${e(o.ownerName)}</a></td><td>${e(o.vehicleLabel)}</td><td>${e(formatUsd(o.total))}</td></tr>`)
            .join("");
    const prev = input.page.page > 1 ? `<a href="/admin/work-orders?f=${input.filter}&amp;page=${input.page.page - 1}">← Anterior</a>` : "";
    const next = input.page.items.length === input.page.pageSize ? `<a href="/admin/work-orders?f=${input.filter}&amp;page=${input.page.page + 1}">Siguiente →</a>` : "";
    return `<h1>Órdenes de trabajo</h1>${flashHtml(input.flash)}<div class="tabs">${tabs}</div>
  <p class="muted">Se abren desde un turno confirmado («Abrir orden de trabajo») o desde la ficha del dueño («Orden de trabajo sin cita»).</p>
  <div class="scroll"><table><thead><tr><th>Orden</th><th>Estado</th><th>Taller</th><th>Dueño</th><th>Vehículo</th><th>Total</th></tr></thead><tbody>${body}</tbody></table></div>
  <div class="pager">${prev}${next}</div>`;
}
export function newWorkOrderView(input) {
    const v = input.values ?? {};
    const intakeKm = v.intakeKm ?? input.vehicle.currentKm ?? "";
    const shopField = input.appointment
        ? `<div>Taller: <strong>${e(input.appointment.shopName)}</strong> · turno del ${e(formatEcDateTime(input.appointment.scheduledAt))}</div>
       <input type="hidden" name="appointmentId" value="${e(input.appointment.id)}">`
        : input.shops.length === 0
            ? `<p class="error">No hay talleres verificados. Aprueba un taller en Verificaciones antes de abrir una orden.</p>`
            : `<label for="shopId">Taller</label><select id="shopId" name="shopId" required>${input.shops
                .map((s) => `<option value="${e(s.id)}"${String(v.shopId ?? "") === s.id ? " selected" : ""}>${e(s.name)} · ${e(s.city)}</option>`)
                .join("")}</select>`;
    return `<div class="stack wide"><p><a href="/admin/users/${e(input.owner.id)}">← ${e(input.owner.name)}</a></p>
  <h1>Nueva orden de trabajo</h1>${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
  <form method="post" action="/admin/work-orders" autocomplete="off">${csrfField(input.csrf)}
  <input type="hidden" name="ownerId" value="${e(input.owner.id)}"><input type="hidden" name="vehicleId" value="${e(input.vehicle.id)}">
  <div class="card"><h2>Recepción del vehículo</h2>
    <div>Dueño: <strong>${e(input.owner.name)}</strong></div>
    <div>Vehículo: <strong>${e(input.vehicle.make)} ${e(input.vehicle.model)} ${e(input.vehicle.year)}</strong>${input.vehicle.plate ? ` · ${e(input.vehicle.plate)}` : ""} · último registro ${e(km(input.vehicle.currentKm))}</div>
    ${shopField}
    <label for="intakeKm">Kilometraje de ingreso</label><input id="intakeKm" name="intakeKm" inputmode="numeric" value="${e(intakeKm)}" required>
    <label for="intakeNotes">Observaciones de ingreso (estado, golpes, objetos, nivel de combustible)</label><textarea id="intakeNotes" name="intakeNotes" maxlength="1000" rows="3">${e(v.intakeNotes)}</textarea>
    <label for="diagnosis">Diagnóstico inicial del taller (opcional)</label><textarea id="diagnosis" name="diagnosis" maxlength="1000" rows="2">${e(v.diagnosis)}</textarea>
  </div>
  <button class="full" type="submit">Abrir orden de trabajo</button></form></div>`;
}
function statusButton(order, csrf, status, label, danger = false) {
    return `<form method="post" action="/admin/work-orders/${e(order.id)}/status">${csrfField(csrf)}<input type="hidden" name="status" value="${status}"><button type="submit"${danger ? ' class="danger"' : ""}>${e(label)}</button></form>`;
}
function reasonForm(order, csrf, status, label, button) {
    return `<form method="post" action="/admin/work-orders/${e(order.id)}/status">${csrfField(csrf)}<input type="hidden" name="status" value="${status}">
    <label for="reason-${status}">${e(label)}</label><input id="reason-${status}" name="reason" maxlength="191" required>
    <button class="danger" type="submit">${e(button)}</button></form>`;
}
export function workOrderDetailView(input) {
    const { order, items, csrf } = input;
    const code = workOrderCode(order.number);
    const editable = EDITABLE_STATUSES.includes(order.status);
    const transitions = WORK_ORDER_TRANSITIONS[order.status] ?? [];
    const itemRows = items.length === 0
        ? `<tr><td colspan="${editable ? 7 : 6}" class="muted">Aún no hay ítems en el presupuesto.</td></tr>`
        : items
            .map((i) => `<tr><td>${i.kind === "mano_obra" ? "Mano de obra" : "Repuesto"}</td><td>${e(i.description)}</td><td>${e([i.brand, i.partCode].filter(Boolean).join(" · ") || "—")}</td>
            <td>${e(String(i.quantity).replace(".", ","))}</td><td>${e(formatUsd(i.unitPrice))}</td><td>${e(formatUsd(lineTotal(i)))}</td>
            ${editable ? `<td><form method="post" action="/admin/work-orders/${e(order.id)}/items/${e(i.id)}/delete">${csrfField(csrf)}<button class="danger" type="submit">Quitar</button></form></td>` : ""}</tr>`)
            .join("");
    const addItem = editable
        ? `<form method="post" action="/admin/work-orders/${e(order.id)}/items" autocomplete="off">${csrfField(csrf)}
      <div class="row"><span><label for="kind">Tipo</label><select id="kind" name="kind">${ITEM_KINDS.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></span>
      <span style="flex:2"><label for="description">Descripción</label><input id="description" name="description" maxlength="191" required></span></div>
      <div class="row"><span><label for="brand">Marca (opcional)</label><input id="brand" name="brand" maxlength="60"></span><span><label for="partCode">Código (opcional)</label><input id="partCode" name="partCode" maxlength="60"></span></div>
      <div class="row"><span><label for="quantity">Cantidad</label><input id="quantity" name="quantity" value="1" inputmode="decimal" required></span><span><label for="unitPrice">Precio unitario (USD)</label><input id="unitPrice" name="unitPrice" inputmode="decimal" placeholder="45,50" required></span></div>
      <button type="submit">Agregar al presupuesto</button></form>`
        : "";
    const diagnosis = editable
        ? `<form method="post" action="/admin/work-orders/${e(order.id)}/diagnosis">${csrfField(csrf)}
      <label for="diag">Diagnóstico del taller</label><textarea id="diag" name="diagnosis" maxlength="1000" rows="3">${e(order.diagnosis)}</textarea>
      <button type="submit">Guardar diagnóstico</button></form>`
        : `<p>${e(order.diagnosis ?? "Sin diagnóstico registrado.")}</p>`;
    const actions = [];
    if (transitions.includes("presupuesto_enviado")) {
        actions.push(items.length > 0
            ? statusButton(order, csrf, "presupuesto_enviado", order.status === "rechazado" ? "Reenviar presupuesto al dueño" : "Enviar presupuesto al dueño")
            : `<p class="muted">Agrega al menos un ítem para enviar el presupuesto.</p>`);
    }
    if (transitions.includes("aprobado"))
        actions.push(statusButton(order, csrf, "aprobado", "El dueño aprobó el presupuesto"));
    if (transitions.includes("rechazado"))
        actions.push(reasonForm(order, csrf, "rechazado", "Si el dueño no aprobó, ¿qué motivo dio?", "El dueño no aprobó"));
    if (transitions.includes("en_ejecucion"))
        actions.push(statusButton(order, csrf, "en_ejecucion", order.status === "esperando_repuesto" ? "Reanudar trabajo" : "Iniciar trabajo"));
    if (transitions.includes("esperando_repuesto"))
        actions.push(statusButton(order, csrf, "esperando_repuesto", "Esperando repuesto"));
    if (transitions.includes("cerrada")) {
        actions.push(`<form method="post" action="/admin/work-orders/${e(order.id)}/close" autocomplete="off">${csrfField(csrf)}
      <h2>Cerrar con evidencia</h2>
      <div class="row"><span><label for="exitKm">Kilometraje de salida</label><input id="exitKm" name="exitKm" inputmode="numeric" value="${e(order.intakeKm ?? order.vehicleKm)}" required></span>
      <span><label for="warrantyDays">Garantía (días)</label><input id="warrantyDays" name="warrantyDays" inputmode="numeric" value="30" required></span></div>
      <label for="nextService">Próximo servicio sugerido (opcional)</label><input id="nextService" name="nextService" maxlength="191" placeholder="Cambio de aceite a los 55.000 km">
      <label for="diagnosisOutcome">Resultado del diagnóstico</label><select id="diagnosisOutcome" name="diagnosisOutcome">${DIAGNOSIS_OUTCOMES.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select>
      <label for="outcomeNote">Causa real o comentario (opcional)</label><input id="outcomeNote" name="outcomeNote" maxlength="191">
      <button class="full" type="submit">Cerrar orden y guardar en el historial</button></form>`);
    }
    if (transitions.includes("cancelada"))
        actions.push(reasonForm(order, csrf, "cancelada", "Motivo de la cancelación", "Cancelar orden"));
    const shopMessage = shopWorkOrderMessage(order);
    return `<div class="stack wide"><p><a href="/admin/work-orders">← Órdenes de trabajo</a></p>
  <h1>${e(code)} · ${e(WORK_ORDER_LABELS[order.status] ?? order.status)}</h1>${flashHtml(input.flash)}
  <div class="card"><h2>Resumen</h2>
    <div>Taller: <strong>${e(order.shopName)}</strong></div>
    <div>Dueño: <a href="/admin/users/${e(order.ownerId)}">${e(order.ownerName)}</a></div>
    <div>Vehículo: ${e(order.vehicleLabel)}${order.plate ? ` · ${e(order.plate)}` : ""}</div>
    ${order.appointmentId ? `<div>Turno: <a href="/admin/appointments/${e(order.appointmentId)}">ver turno</a></div>` : "<div>Sin cita previa</div>"}
    <div>Ingreso: ${order.intakeKm !== null ? e(km(order.intakeKm)) : "—"} · ${e(formatEcDateTime(order.createdAt))}</div>
    ${order.intakeNotes ? `<div>Observaciones: ${e(order.intakeNotes)}</div>` : ""}
    ${order.rejectionReason ? `<div>Motivo del rechazo: ${e(order.rejectionReason)}</div>` : ""}
    ${order.cancelReason ? `<div>Motivo de la cancelación: ${e(order.cancelReason)}</div>` : ""}
    ${order.status === "cerrada" ? `<div>Salida: ${e(km(order.exitKm))} · garantía ${e(order.warrantyDays)} días${order.nextService ? ` · próximo: ${e(order.nextService)}` : ""}</div>` : ""}
  </div>
  <div class="card"><h2>Diagnóstico</h2>${diagnosis}</div>
  <div class="card"><h2>Presupuesto</h2>
    <div class="scroll"><table><thead><tr><th>Tipo</th><th>Descripción</th><th>Marca / código</th><th>Cant.</th><th>P. unit.</th><th>Total</th>${editable ? "<th></th>" : ""}</tr></thead>
    <tbody>${itemRows}</tbody></table></div>
    <p><strong>Total: ${e(formatUsd(order.total))}</strong></p>
    ${editable ? "" : '<p class="muted">El presupuesto se edita solo en recepción o después de un rechazo.</p>'}
    ${addItem}
  </div>
  <div class="card"><h2>Mensajes para enviar por WhatsApp</h2>
    ${copyBox("msg-owner", "Mensaje para el dueño", ownerWorkOrderMessage(order, items))}
    ${shopMessage ? copyBox("msg-shop", "Mensaje para el taller", shopMessage, 3) : ""}
    <p class="row">${chatLink(order.ownerPhone, "Abrir chat del dueño")} ${chatLink(order.shopPhone, "Abrir chat del taller")}</p>
  </div>
  ${actions.length > 0 ? `<div class="card"><h2>Siguiente paso</h2>${actions.join("")}</div>` : ""}
  </div>`;
}
export function userWorkOrdersSection(orders) {
    if (orders.length === 0)
        return "";
    return `<div class="card"><h2>Órdenes de trabajo</h2>${orders
        .map((o) => `<div><a href="/admin/work-orders/${e(o.id)}">${e(workOrderCode(o.number))}</a> · ${e(WORK_ORDER_LABELS[o.status] ?? o.status)} · ${e(o.shopName)} · ${e(o.vehicleLabel)} · ${e(formatUsd(o.total))}</div>`)
        .join("")}</div>`;
}
export function historySection(history) {
    if (history.length === 0)
        return "";
    return `<div class="card"><h2>Historial de servicios</h2>${history
        .map((h) => `<div><span class="muted">${e(formatEcDateTime(h.createdAt))}</span> · <strong>${e(h.vehicleLabel)}</strong> · ${e(h.shopName)} · ${e(h.description)}${h.cost !== null ? ` · ${e(formatUsd(h.cost))}` : ""}</div>`)
        .join("")}</div>`;
}
//# sourceMappingURL=views-work-orders.js.map