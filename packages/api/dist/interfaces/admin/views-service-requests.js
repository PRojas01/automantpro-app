import { escapeHtml as e } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { CATEGORIES, OFFER_STATUS_LABELS, REQUEST_STATUS_LABELS, categoryName, comparisonMessage, invitationMessage, serviceRequestCode, } from "../../application/service-requests/workflow.js";
// Vistas de las solicitudes de especialista (docs/45).
const flashHtml = (flash) => (flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "");
const csrfField = (csrf) => `<input type="hidden" name="csrf" value="${e(csrf)}">`;
function when(value) {
    if (!value)
        return "—";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short", timeZone: "America/Guayaquil" }).format(date);
}
const money = (value) => (value === null ? "—" : `US$ ${value.toFixed(2)}`);
const FILTERS = [
    ["abiertas", "Abiertas"],
    ["sin_respuesta", "Sin respuesta"],
    ["cerradas", "Cerradas"],
    ["todas", "Todas"],
];
export function serviceRequestsListView(input) {
    const tabs = FILTERS.map(([key, label]) => `<a class="${key === input.filter ? "active" : ""}" href="/admin/service-requests?f=${e(key)}">${e(label)}</a>`).join("");
    const filas = input.items
        .map((r) => `<tr><td><a href="/admin/service-requests/${e(r.id)}">${e(serviceRequestCode(r.number))}</a></td>
      <td>${e(categoryName(r.category))}<br><span class="muted">${e(r.description.slice(0, 80))}</span></td>
      <td>${e(r.ownerName)}${r.vehicleLabel ? `<br><span class="muted">${e(r.vehicleLabel)}</span>` : ""}</td>
      <td>${e([r.zone, r.city].filter(Boolean).join(", ") || "—")}</td>
      <td>${e(REQUEST_STATUS_LABELS[r.status] ?? r.status)}<br><span class="muted">${r.respuestas ?? 0} respuestas</span></td>
      <td>${e(when(r.createdAt))}</td></tr>`)
        .join("");
    return `<div class="stack wide"><h1>Solicitudes de especialista</h1>${flashHtml(input.flash)}
  <div class="tabs">${tabs}</div>
  <div class="card"><h2>Para qué sirve</h2>
    <p class="muted">Cuando alguien necesita un especialista —electromecánica, caja, aire acondicionado— la solicitud llega a los talleres verificados que atienden esa especialidad en su ciudad. Cada taller responde con precio, tiempo y disponibilidad, y el dueño elige.</p></div>
  ${input.items.length === 0 ? `<p class="muted">No hay solicitudes con ese filtro.</p>` : ""}
  <div class="scroll"><table><thead><tr><th>Código</th><th>Necesita</th><th>Dueño</th><th>Zona</th><th>Estado</th><th>Creada</th></tr></thead>
  <tbody>${filas}</tbody></table></div></div>`;
}
export function newServiceRequestView(input) {
    const valor = (name) => {
        const raw = input.values?.[name];
        return typeof raw === "string" ? e(raw) : "";
    };
    const opciones = CATEGORIES.map((c) => `<option value="${e(c.id)}"${valor("category") === c.id ? " selected" : ""}>${e(c.name)}</option>`).join("");
    const vehiculos = input.vehicles.map((v) => `<option value="${e(v.id)}">${e(v.label)}</option>`).join("");
    const talleres = input.shops.length
        ? input.shops
            .map((shop) => `<label class="choice"><input type="checkbox" name="shopIds" value="${e(shop.id)}"${shop.specialist ? " checked" : ""}>
        <span><strong>${e(shop.name)}</strong>${shop.specialist ? ' <span class="ok">atiende esa especialidad</span>' : ""}${shop.sameZone ? ' <span class="muted">· misma zona</span>' : ""}
        <br><span class="muted">${e([shop.zone, shop.city].filter(Boolean).join(", "))}</span></span></label>`)
            .join("")
        : `<p class="error">No hay talleres verificados en esa ciudad todavía.</p>`;
    return `<div class="stack wide"><h1>Nueva solicitud de especialista</h1>
  ${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
  <div class="card"><p>Para <strong>${e(input.owner.name)}</strong>${input.owner.city ? ` · ${e(input.owner.city)}` : ""}</p>
  <form method="post" action="/admin/service-requests" autocomplete="off">${csrfField(input.csrf)}
  <input type="hidden" name="ownerId" value="${e(input.owner.id)}">
  <label for="category">¿Qué especialidad necesita?</label><select id="category" name="category">${opciones}</select>
  ${vehiculos ? `<label for="vehicleId">Vehículo</label><select id="vehicleId" name="vehicleId">${vehiculos}</select>` : ""}
  <label for="description">Qué necesita, en sus palabras</label>
  <textarea id="description" name="description" rows="3" maxlength="1000" required placeholder="Busca un experto en electromecánica: el alternador no carga">${valor("description")}</textarea>
  <label for="zone">Zona (opcional)</label><input id="zone" name="zone" maxlength="120" value="${valor("zone")}" placeholder="Norte">
  <p class="muted">Talleres a los que se envía la solicitud:</p>
  ${talleres}
  <button class="full" type="submit">Crear la solicitud y preparar los mensajes</button></form></div></div>`;
}
export function serviceRequestDetailView(input) {
    const { request, offers, csrf } = input;
    const resumen = {
        number: request.number,
        category: request.category,
        description: request.description,
        vehicle: request.vehicleLabel,
        city: request.city,
        zone: request.zone,
    };
    const invitacion = invitationMessage(resumen);
    const respuestas = offers.filter((o) => o.status === "ofertado");
    const comparacion = comparisonMessage(resumen, respuestas.map((o) => ({
        shopName: o.shopName,
        priceUsd: o.priceUsd,
        durationMin: o.durationMin,
        availability: o.availability,
        warrantyDays: o.warrantyDays,
    })));
    const abierta = request.status === "abierta";
    const tarjetas = offers
        .map((offer) => {
        const digits = offer.shopId ? "" : "";
        void digits;
        const responder = abierta
            ? `<form method="post" action="/admin/service-requests/${e(request.id)}/offers/${e(offer.id)}" autocomplete="off">${csrfField(csrf)}
          <label for="price-${e(offer.id)}">Precio estimado (US$)</label><input id="price-${e(offer.id)}" name="price" inputmode="decimal" value="${offer.priceUsd === null ? "" : e(offer.priceUsd.toFixed(2))}">
          <label for="dur-${e(offer.id)}">Duración (minutos)</label><input id="dur-${e(offer.id)}" name="duration" inputmode="numeric" value="${offer.durationMin === null ? "" : e(String(offer.durationMin))}">
          <label for="av-${e(offer.id)}">Disponibilidad</label><input id="av-${e(offer.id)}" name="availability" maxlength="191" value="${e(offer.availability ?? "")}" placeholder="Mañana desde las 9:00">
          <label for="war-${e(offer.id)}">Garantía (días)</label><input id="war-${e(offer.id)}" name="warranty" inputmode="numeric" value="${offer.warrantyDays === null ? "" : e(String(offer.warrantyDays))}">
          <label for="notes-${e(offer.id)}">Notas</label><input id="notes-${e(offer.id)}" name="notes" maxlength="191" value="${e(offer.notes ?? "")}">
          <button type="submit" name="action" value="ofertado">Guardar respuesta</button>
          <button class="danger" type="submit" name="action" value="sin_disponibilidad">Sin disponibilidad</button></form>
          ${offer.status === "ofertado" ? `<form method="post" action="/admin/service-requests/${e(request.id)}/choose">${csrfField(csrf)}<input type="hidden" name="offerId" value="${e(offer.id)}"><button type="submit">Elegir este taller</button></form>` : ""}`
            : "";
        return `<div class="card"><h2>${e(offer.shopName)}</h2>
        <div class="muted">${e([offer.shopZone, offer.shopCity].filter(Boolean).join(", "))}</div>
        <div>Estado: <strong>${e(OFFER_STATUS_LABELS[offer.status] ?? offer.status)}</strong></div>
        <div>${e(money(offer.priceUsd))}${offer.durationMin ? ` · ${offer.durationMin} min` : ""}${offer.availability ? ` · ${e(offer.availability)}` : ""}${offer.warrantyDays ? ` · garantía ${offer.warrantyDays} días` : ""}</div>
        ${offer.notes ? `<div class="muted">${e(offer.notes)}</div>` : ""}
        ${responder}</div>`;
    })
        .join("");
    return `<div class="stack wide"><p><a href="/admin/service-requests">← Solicitudes</a></p>
  <h1>${e(serviceRequestCode(request.number))} · ${e(categoryName(request.category))}</h1>${flashHtml(input.flash)}
  <div class="card"><h2>La solicitud</h2>
    <div>${e(request.ownerName)} · ${e(formatWhatsappNumber(request.ownerPhone.replace(/\\D/g, "")))}${request.vehicleLabel ? ` · ${e(request.vehicleLabel)}` : ""}</div>
    <div class="muted">${e([request.zone, request.city].filter(Boolean).join(", ") || "sin zona")}</div>
    <p>${e(request.description)}</p>
    <div>Estado: <strong>${e(REQUEST_STATUS_LABELS[request.status] ?? request.status)}</strong>${request.closeReason ? ` <span class="muted">(${e(request.closeReason)})</span>` : ""}</div>
    <label for="invitacion">Mensaje para los talleres</label><textarea id="invitacion" readonly rows="8">${e(invitacion)}</textarea>
    <label for="comparacion">Mensaje para el dueño</label><textarea id="comparacion" readonly rows="7">${e(comparacion)}</textarea>
    ${abierta
        ? `<form method="post" action="/admin/service-requests/${e(request.id)}/close">${csrfField(csrf)}
        <label for="cierre">Motivo para cancelar</label><input id="cierre" name="reason" maxlength="191" required>
        <button class="danger" type="submit">Cancelar la solicitud</button></form>`
        : ""}
  </div>
  ${tarjetas}</div>`;
}
//# sourceMappingURL=views-service-requests.js.map