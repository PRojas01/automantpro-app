import { escapeHtml as e } from "../entry/page.js";
import { FEATURE_LABELS, PAYMENT_METHODS, PLAN_LABELS, STATUS_LABELS, currentSubscription, daysLeft, limitsFor, upgradeMessage, isRunning, effectivePlan, subscriptionCode, } from "../../application/plans/plans.js";
// Vistas de planes y verificación de pagos (docs/42).
const flashHtml = (flash) => (flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "");
const csrfField = (csrf) => `<input type="hidden" name="csrf" value="${e(csrf)}">`;
function when(value) {
    if (!value)
        return "—";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeZone: "America/Guayaquil" }).format(date);
}
const money = (value) => (value === null ? "—" : `US$ ${value.toFixed(2)}`);
const FILTERS = [
    ["pendiente", "Por verificar"],
    ["activa", "Activas"],
    ["por_vencer", "Por vencer"],
    ["vencida", "Vencidas"],
    ["todas", "Todas"],
];
/** Insignia del plan vigente, para usar en fichas y en Atender. */
export function planBadge(plan, endsAt) {
    const left = daysLeft(endsAt ?? null);
    const detalle = plan === "gratis" ? "" : left === null ? "" : left >= 0 ? ` · ${left} días` : " · vencido";
    const clase = plan === "premium" ? "ok" : plan === "prueba" ? "" : "muted";
    return `<span class="${clase}"><strong>${e(PLAN_LABELS[plan])}</strong>${e(detalle)}</span>`;
}
export function plansListView(input) {
    const tabs = FILTERS.map(([key, label]) => `<a class="${key === input.filter ? "active" : ""}" href="/admin/plans?f=${e(key)}">${e(label)}${key === "pendiente" && input.pending > 0 ? ` (${input.pending})` : ""}</a>`).join("");
    const rows = input.items
        .map((s) => {
        const left = daysLeft(s.endsAt);
        const vigencia = s.status === "activa"
            ? s.endsAt
                ? `${when(s.startsAt)} → ${when(s.endsAt)}<br><span class="${left !== null && left <= 7 ? "error" : "muted"}">${left} días</span>`
                : `desde ${when(s.startsAt)}<br><span class="muted">sin vencimiento</span>`
            : `<span class="muted">${when(s.createdAt)}</span>`;
        const acciones = input.canDecide && s.status === "pendiente"
            ? `<form method="post" action="/admin/subscriptions/${e(s.id)}/verify">${csrfField(input.csrf)}
            <label for="m-${e(s.id)}">Meses pagados</label><input id="m-${e(s.id)}" name="months" inputmode="numeric" value="${e(String(s.months ?? 1))}">
            <button type="submit">Verificar el pago y activar</button></form>
            <form method="post" action="/admin/subscriptions/${e(s.id)}/reject">${csrfField(input.csrf)}
            <label for="r-${e(s.id)}">Motivo del rechazo</label><input id="r-${e(s.id)}" name="reason" maxlength="191" required>
            <button class="danger" type="submit">Rechazar</button></form>`
            : input.canDecide && s.status === "activa"
                ? `<form method="post" action="/admin/subscriptions/${e(s.id)}/cancel">${csrfField(input.csrf)}
              <label for="c-${e(s.id)}">Motivo de la baja</label><input id="c-${e(s.id)}" name="reason" maxlength="191" required>
              <button class="danger" type="submit">Dar de baja</button></form>`
                : s.decisionReason
                    ? `<span class="muted">${e(s.decisionReason)}</span>`
                    : "";
        return `<tr><td>${e(subscriptionCode(s.number))}</td>
      <td><a href="/admin/users/${e(s.userId)}">${e(s.userName ?? s.userId)}</a><br><span class="muted">${e(s.userRole ?? "")}</span></td>
      <td>${e(PLAN_LABELS[s.plan] ?? s.plan)}<br><span class="muted">${e(STATUS_LABELS[s.status] ?? s.status)}</span></td>
      <td>${e(money(s.amountUsd))}<br><span class="muted">${e(s.method ?? "—")}${s.reference ? ` · ${e(s.reference)}` : ""}</span></td>
      <td>${vigencia}</td>
      <td>${acciones}</td></tr>`;
    })
        .join("");
    return `<div class="stack wide"><h1>Planes y pagos</h1>${flashHtml(input.flash)}
  <div class="tabs">${tabs}</div>
  <div class="card"><h2>Cómo se cobra hoy</h2>
    <p class="muted">El cliente transfiere y el operador registra el pago desde su ficha. La suscripción queda <strong>pendiente</strong> hasta que un administrador verifica que el dinero llegó: recién ahí se activa el plan.</p>
    <p class="muted">Premium habilita: ${Object.values(FEATURE_LABELS).slice(2).map((f) => e(f)).join(" · ")}.</p></div>
  ${input.items.length === 0 ? `<p class="muted">No hay suscripciones con ese filtro.</p>` : ""}
  <div class="scroll"><table><thead><tr><th>Código</th><th>Titular</th><th>Plan</th><th>Pago</th><th>Vigencia</th><th>Acciones</th></tr></thead>
  <tbody>${rows}</tbody></table></div></div>`;
}
/** Tarjeta del plan en la ficha del usuario: estado actual, historial y alta de un pago. */
export function userPlanCard(userId, subs, csrf, canRegister, role = "dueno", usage = {}) {
    const plan = effectivePlan(subs);
    const current = currentSubscription(subs);
    const pendiente = subs.find((s) => s.status === "pendiente");
    const historial = subs.length
        ? `<ul>${subs
            .map((s) => `<li>${e(subscriptionCode(s.number))} · ${e(PLAN_LABELS[s.plan] ?? s.plan)} · ${e(STATUS_LABELS[s.status] ?? s.status)} · ${e(money(s.amountUsd))}${isRunning(s) && s.endsAt ? ` · vence ${when(s.endsAt)}` : ""}</li>`)
            .join("")}</ul>`
        : `<p class="muted">Sin suscripciones registradas.</p>`;
    const alta = canRegister
        ? `<form method="post" action="/admin/users/${e(userId)}/subscriptions" autocomplete="off">${csrfField(csrf)}
      <label for="plan">Plan</label>
      <select id="plan" name="plan"><option value="premium">Premium</option><option value="prueba">Prueba</option></select>
      <label for="months">Meses pagados (vacío = sin vencimiento)</label><input id="months" name="months" inputmode="numeric" value="1">
      <label for="amount">Monto recibido (US$)</label><input id="amount" name="amount" inputmode="decimal" placeholder="9,99">
      <label for="method">Forma de pago</label>
      <select id="method" name="method">${PAYMENT_METHODS.map(([key, label]) => `<option value="${e(key)}">${e(label)}</option>`).join("")}</select>
      <label for="reference">Referencia o comprobante</label><input id="reference" name="reference" maxlength="191" placeholder="Nº de transferencia">
      <label for="notes">Notas</label><input id="notes" name="notes" maxlength="500">
      <button class="full" type="submit">Registrar el pago (queda por verificar)</button></form>`
        : "";
    const limites = limitsFor(plan, role, usage);
    const limitesHtml = limites.length
        ? `<ul>${limites
            .map((l) => `<li>${e(String(l.used))} de ${e(String(l.limit))} ${e(l.label)}${l.reached ? ' <span class="error">(llegó al tope)</span>' : ""}</li>`)
            .join("")}</ul>
      ${limites.some((l) => l.reached) ? `<label for="upgrade">Mensaje para ofrecerle el plan</label><textarea id="upgrade" readonly rows="3">${e(upgradeMessage(role, limites.find((l) => l.reached)))}</textarea>` : ""}`
        : "";
    return `<div class="card"><h2>Plan</h2>
    <p>Plan vigente: ${planBadge(plan, current?.endsAt ?? null)}</p>
    ${limitesHtml}
    ${pendiente ? `<p class="error">Tiene un pago pendiente de verificación (${e(subscriptionCode(pendiente.number))}).</p>` : ""}
    ${historial}${alta}
    <p class="muted">El plan se activa solo cuando un administrador verifica el pago en «Planes y pagos».</p></div>`;
}
//# sourceMappingURL=views-plans.js.map