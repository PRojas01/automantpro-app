import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { formatEcDateTime } from "../../application/appointments/messages.js";
import { formatUsd } from "../../application/work-orders/workflow.js";
import { LOSS_REASONS, MAX_STORES_PER_REQUEST, ORDER_STAGE_LABELS, ORDER_STAGE_TRANSITIONS, QUOTE_LABELS, REQUEST_LABELS, comparisonMessage, lostQuoteMessage, quoteRequestCode, rankQuotes, requesterOrderMessage, storeOrderMessage, storeRequestMessage, } from "../../application/quotes/workflow.js";
const e = (value) => escapeHtml(value === null || value === undefined ? "" : String(value));
const csrfField = (token) => `<input type="hidden" name="csrf" value="${e(token)}">`;
const flashHtml = (flash) => flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "";
const FILTERS = [
    ["abiertas", "Abiertas"],
    ["con_pedido", "Con pedido"],
    ["todas", "Todas"],
];
function chatLink(phone, label) {
    const digits = phone.replace(/\D/g, "");
    if (!phone.startsWith("+") || digits.length < 8)
        return "";
    return `<a href="https://wa.me/${e(digits)}" target="_blank" rel="noopener">${e(label)} (${e(formatWhatsappNumber(digits))})</a>`;
}
function copyBox(id, label, content, rows = 8) {
    return `<label for="${id}">${e(label)}</label><textarea id="${id}" readonly rows="${rows}">${e(content)}</textarea>`;
}
export function quotesListView(input) {
    const tabs = FILTERS.map(([id, label]) => `<a href="/admin/quotes?f=${id}"${id === input.filter ? ' class="active"' : ""}>${e(label)}</a>`).join("");
    const body = input.page.items.length === 0
        ? `<tr><td colspan="6" class="muted">Sin solicitudes</td></tr>`
        : input.page.items
            .map((r) => `<tr><td><a href="/admin/quotes/${e(r.id)}">${e(quoteRequestCode(r.number))}</a></td><td>${e(REQUEST_LABELS[r.status] ?? r.status)}</td>
            <td>${e(r.partName)}${r.quantity > 1 ? ` x${e(r.quantity)}` : ""}</td><td><a href="/admin/users/${e(r.requesterId)}">${e(r.requesterName)}</a></td><td>${e(r.vehicleLabel ?? "—")}</td><td>${e(formatEcDateTime(r.createdAt))}</td></tr>`)
            .join("");
    const prev = input.page.page > 1 ? `<a href="/admin/quotes?f=${input.filter}&amp;page=${input.page.page - 1}">← Anterior</a>` : "";
    const next = input.page.items.length === input.page.pageSize ? `<a href="/admin/quotes?f=${input.filter}&amp;page=${input.page.page + 1}">Siguiente →</a>` : "";
    return `<h1>Cotizaciones de repuestos</h1>${flashHtml(input.flash)}<div class="tabs">${tabs}</div>
  <p class="muted">Se piden desde el vehículo de un dueño («Cotizar repuesto») o desde una orden de trabajo («Pedir repuestos a almacenes»).</p>
  <div class="scroll"><table><thead><tr><th>Solicitud</th><th>Estado</th><th>Repuesto</th><th>Solicitante</th><th>Vehículo</th><th>Fecha</th></tr></thead><tbody>${body}</tbody></table></div>
  <div class="pager">${prev}${next}</div>`;
}
export function newQuoteView(input) {
    const v = input.values ?? {};
    const chosen = Array.isArray(v.storeIds) ? v.storeIds.map(String) : v.storeIds ? [String(v.storeIds)] : null;
    const storeChecks = input.stores.length === 0
        ? `<p class="error">No hay almacenes verificados. Aprueba al menos uno en Verificaciones.</p>`
        : `${input.sameCity ? "" : `<p class="muted">No hay almacenes verificados en ${e(input.city)}; se muestran los de otras ciudades.</p>`}
        <div class="checks">${input.stores
            .map((s, i) => {
            const checked = chosen ? chosen.includes(s.id) : i < MAX_STORES_PER_REQUEST;
            return `<label><input type="checkbox" name="storeIds" value="${e(s.id)}"${checked ? " checked" : ""}> ${e(s.name)} <span class="muted">· ${e(s.city)}${s.zone ? ` (${e(s.zone)})` : ""}${s.delivery ? " · entrega a domicilio" : ""}</span></label>`;
        })
            .join("")}</div>`;
    return `<div class="stack wide"><p><a href="/admin/users/${e(input.requester.id)}">← ${e(input.requester.name)}</a></p>
  <h1>Nueva solicitud de cotización</h1>${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
  <form method="post" action="/admin/quotes" autocomplete="off">${csrfField(input.csrf)}
  <input type="hidden" name="requesterId" value="${e(input.requester.id)}">
  ${input.vehicle ? `<input type="hidden" name="vehicleId" value="${e(input.vehicle.id)}">` : ""}
  ${input.workOrderId ? `<input type="hidden" name="workOrderId" value="${e(input.workOrderId)}">` : ""}
  <div class="card"><h2>Repuesto</h2>
    <div>Solicitante: <strong>${e(input.requester.name)}</strong>${input.vehicle ? ` · ${e(input.vehicle.make)} ${e(input.vehicle.model)} ${e(input.vehicle.year)}` : ""} · ${e(input.city)}</div>
    <label for="partName">Qué repuesto necesita</label><input id="partName" name="partName" maxlength="191" required value="${e(v.partName)}" placeholder="Pastillas de freno delanteras">
    <div class="row"><span><label for="partCode">Código OEM (opcional)</label><input id="partCode" name="partCode" maxlength="60" value="${e(v.partCode)}"></span>
    <span><label for="quantity">Cantidad</label><input id="quantity" name="quantity" inputmode="numeric" maxlength="3" value="${e(v.quantity ?? "1")}" required></span></div>
    <label for="notes">Notas para los almacenes (opcional)</label><textarea id="notes" name="notes" maxlength="500" rows="2">${e(v.notes)}</textarea>
  </div>
  <div class="card"><h2>A qué almacenes (máximo ${MAX_STORES_PER_REQUEST})</h2>${storeChecks}</div>
  <button class="full" type="submit">Crear solicitud</button></form></div>`;
}
function responseForm(requestId, q, csrf) {
    const unit = q.unitPrice !== null ? String(q.unitPrice).replace(".", ",") : "";
    return `<details><summary>Registrar respuesta de ${e(q.storeName)}</summary>
    <form method="post" action="/admin/quotes/${e(requestId)}/quotes/${e(q.id)}" autocomplete="off">${csrfField(csrf)}
    <div class="row"><span><label>Precio unitario (USD)</label><input name="unitPrice" inputmode="decimal" value="${e(unit)}" placeholder="45,50"></span>
    <span><label>Marca</label><input name="brand" maxlength="60" value="${e(q.brand)}"></span></div>
    <div class="row"><span><label>Disponibilidad</label><input name="availability" maxlength="60" value="${e(q.availability)}" placeholder="En stock"></span>
    <span><label>Tiempo de entrega</label><input name="deliveryTime" maxlength="60" value="${e(q.deliveryTime)}" placeholder="Hoy mismo"></span></div>
    <div class="row"><span><label>Garantía (días)</label><input name="warrantyDays" inputmode="numeric" value="${e(q.warrantyDays)}"></span>
    <span><label>Validez (días)</label><input name="validDays" inputmode="numeric" value="${e(q.validDays)}"></span></div>
    <label>Notas</label><input name="notes" maxlength="191" value="${e(q.notes)}">
    <div class="row"><button type="submit" name="action" value="cotizado">Guardar cotización</button>
    <button class="danger" type="submit" name="action" value="sin_stock">No lo tiene</button></div></form></details>`;
}
export function quoteDetailView(input) {
    const { request, quotes, order, csrf } = input;
    const code = quoteRequestCode(request.number);
    const open = request.status === "abierta";
    const ranked = rankQuotes(quotes);
    const invited = quotes
        .map((q) => `<tr><td>${e(q.storeName)}</td><td>${e(QUOTE_LABELS[q.status] ?? q.status)}</td><td>${q.unitPrice !== null ? e(formatUsd(q.unitPrice)) : "—"}</td>
      <td>${e([q.brand, q.availability, q.deliveryTime ? `entrega ${q.deliveryTime}` : null, q.warrantyDays ? `garantía ${q.warrantyDays} días` : null].filter(Boolean).join(" · ") || q.notes || "—")}</td>
      <td>${chatLink(q.storePhone, "Chat")}</td></tr>`)
        .join("");
    const responses = open ? quotes.map((q) => responseForm(request.id, q, csrf)).join("") : "";
    const chooseForms = open && ranked.length > 0
        ? `<h2>Elegir la opción del cliente</h2>${ranked
            .map((q, i) => `<form method="post" action="/admin/quotes/${e(request.id)}/choose" class="row">${csrfField(csrf)}<input type="hidden" name="quoteId" value="${e(q.id)}">
            <span>${i + 1}) <strong>${e(q.storeName)}</strong> · ${e(formatUsd(q.unitPrice ?? 0))} c/u</span><button type="submit">Eligió esta</button></form>`)
            .join("")}`
        : "";
    const closeForm = open
        ? `<form method="post" action="/admin/quotes/${e(request.id)}/close">${csrfField(csrf)}
      <label for="close-reason">Si el cliente no pidió ninguna, ¿por qué?</label><input id="close-reason" name="reason" maxlength="191" required>
      <button class="danger" type="submit">Cerrar sin pedido</button></form>`
        : "";
    const lost = order
        ? quotes
            .filter((q) => q.status === "descartada")
            .map((q) => `<form method="post" action="/admin/quotes/${e(request.id)}/quotes/${e(q.id)}/loss" class="row">${csrfField(csrf)}
          <span>${e(q.storeName)}: motivo de pérdida</span><select name="reason">${LOSS_REASONS.map(([id, label]) => `<option value="${id}"${q.lossReason === id ? " selected" : ""}>${label}</option>`).join("")}</select>
          <button type="submit">Guardar</button></form>`)
            .join("")
        : "";
    let orderCard = "";
    if (order) {
        const transitions = ORDER_STAGE_TRANSITIONS[order.stage] ?? [];
        const buttons = transitions
            .filter((s) => s !== "cancelado")
            .map((s) => `<form method="post" action="/admin/quotes/${e(request.id)}/order/stage">${csrfField(csrf)}<input type="hidden" name="stage" value="${s}"><button type="submit">${e(ORDER_STAGE_LABELS[s])}</button></form>`)
            .join("");
        const cancel = transitions.includes("cancelado")
            ? `<form method="post" action="/admin/quotes/${e(request.id)}/order/stage">${csrfField(csrf)}<input type="hidden" name="stage" value="cancelado">
        <label for="order-cancel">Motivo de la cancelación</label><input id="order-cancel" name="reason" maxlength="191" required><button class="danger" type="submit">Cancelar pedido</button></form>`
            : "";
        orderCard = `<div class="card"><h2>Pedido · ${e(ORDER_STAGE_LABELS[order.stage] ?? order.stage)}</h2>
      <div><strong>${e(order.storeName)}</strong> · ${e(order.partName)}${order.quantity > 1 ? ` x${e(order.quantity)}` : ""} · total ${e(formatUsd(order.total))}</div>
      ${copyBox("msg-order-requester", "Mensaje para el solicitante", requesterOrderMessage(order), 6)}
      ${order.stage === "confirmado" || order.stage === "cancelado" ? copyBox("msg-order-store", "Mensaje para el almacén", storeOrderMessage(order), 6) : ""}
      <p class="row">${chatLink(order.requesterPhone, "Chat del solicitante")} ${chatLink(order.storePhone, "Chat del almacén")}</p>
      ${buttons ? `<div class="row">${buttons}</div>` : ""}${cancel}
      ${lost ? `<h2>Almacenes no elegidos</h2>${copyBox("msg-lost", "Mensaje para los no elegidos", lostQuoteMessage(request), 4)}${lost}` : ""}</div>`;
    }
    return `<div class="stack wide"><p><a href="/admin/quotes">← Cotizaciones</a></p>
  <h1>${e(code)} · ${e(REQUEST_LABELS[request.status] ?? request.status)}</h1>${flashHtml(input.flash)}
  <div class="card"><h2>Solicitud</h2>
    <div>Repuesto: <strong>${e(request.partName)}</strong>${request.quantity > 1 ? ` x${e(request.quantity)}` : ""}${request.partCode ? ` · código ${e(request.partCode)}` : ""}</div>
    <div>Solicitante: <a href="/admin/users/${e(request.requesterId)}">${e(request.requesterName)}</a>${request.vehicleLabel ? ` · ${e(request.vehicleLabel)}` : ""} · ${e(request.city)}</div>
    ${request.workOrderId ? `<div>Para la orden de trabajo: <a href="/admin/work-orders/${e(request.workOrderId)}">ver orden</a></div>` : ""}
    ${request.notes ? `<div>Notas: ${e(request.notes)}</div>` : ""}
    ${request.closeReason ? `<div>Cerrada sin pedido: ${e(request.closeReason)}</div>` : ""}
  </div>
  ${open ? `<div class="card"><h2>1. Enviar a los almacenes</h2>${copyBox("msg-stores", "Mensaje para cada almacén", storeRequestMessage(request))}</div>` : ""}
  <div class="card"><h2>${open ? "2. Respuestas de los almacenes" : "Respuestas"}</h2>
    <div class="scroll"><table><thead><tr><th>Almacén</th><th>Estado</th><th>Precio c/u</th><th>Detalle</th><th></th></tr></thead><tbody>${invited}</tbody></table></div>
    ${responses}</div>
  ${open ? `<div class="card"><h2>3. Comparativa para el cliente</h2>${copyBox("msg-compare", "Mensaje con la comparativa", comparisonMessage(request, quotes), 9)}<p>${chatLink(request.requesterPhone, "Abrir chat del solicitante")}</p>${chooseForms}${closeForm}</div>` : ""}
  ${orderCard}
  </div>`;
}
export function userQuotesSection(data) {
    if (!data)
        return "";
    const parts = [];
    if (data.requests.length > 0) {
        parts.push(`<h2>Cotizaciones pedidas</h2>${data.requests
            .map((r) => `<div><a href="/admin/quotes/${e(r.id)}">${e(quoteRequestCode(r.number))}</a> · ${e(REQUEST_LABELS[r.status] ?? r.status)} · ${e(r.partName)}</div>`)
            .join("")}`);
    }
    if (data.storeQuotes.length > 0) {
        parts.push(`<h2>Cotizaciones recibidas como almacén</h2>${data.storeQuotes
            .map((q) => `<div><a href="/admin/quotes/${e(q.requestId)}">${e(quoteRequestCode(q.requestNumber))}</a> · ${e(QUOTE_LABELS[q.status] ?? q.status)} · ${e(q.partName)}</div>`)
            .join("")}`);
    }
    if (data.orders.length > 0) {
        parts.push(`<h2>Pedidos de repuestos</h2>${data.orders
            .map((o) => `<div><a href="/admin/quotes/${e(o.quoteRequestId)}">${e(quoteRequestCode(o.requestNumber))}</a> · ${e(ORDER_STAGE_LABELS[o.stage] ?? o.stage)} · ${e(o.partName)} · ${e(o.storeName)} · ${e(formatUsd(o.total))}</div>`)
            .join("")}`);
    }
    return parts.length > 0 ? `<div class="card">${parts.join("")}</div>` : "";
}
//# sourceMappingURL=views-quotes.js.map