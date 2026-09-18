import { escapeHtml as e } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { PARTY_ROLE_LABELS, RELATION_KIND_LABELS, RELATION_STATUS_LABELS, RELATION_TRANSITIONS, SANCTION_LEVELS, disputeCode, groupAllowed, isActive, relationCode, relayMessage, sanctionLabel, waitingHours, } from "../../application/relations/workflow.js";
// Vistas de la bandeja de relaciones, las disputas y las sanciones (docs/35 M1–M5).
const FILTERS = [
    ["abiertas", "Abiertas"],
    ["esperando", "Esperan respuesta"],
    ["disputa", "En disputa"],
    ["cerradas", "Cerradas"],
    ["todas", "Todas"],
];
const DISPUTE_FILTERS = [
    ["abierta", "Abiertas"],
    ["en_revision", "En revisión"],
    ["resuelta", "Resueltas"],
    ["rechazada", "Rechazadas"],
    ["todas", "Todas"],
];
const flashHtml = (flash) => flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "";
const csrfField = (csrf) => `<input type="hidden" name="csrf" value="${e(csrf)}">`;
function when(value) {
    if (!value)
        return "—";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short", timeZone: "America/Guayaquil" }).format(date);
}
function tabs(current, base, options) {
    return `<div class="tabs">${options
        .map(([key, label]) => `<a class="${key === current ? "active" : ""}" href="${base}?f=${e(key)}">${e(label)}</a>`)
        .join("")}</div>`;
}
export function relationsListView(input) {
    const rows = input.page.items
        .map((r) => {
        const waiting = waitingHours(r.waitingSince);
        const late = waiting !== null && waiting >= input.waitingHours;
        return `<tr><td><a href="/admin/relations/${e(r.id)}">${e(relationCode(r.number))}</a></td>
      <td>${e(RELATION_KIND_LABELS[r.kind] ?? r.kind)}</td>
      <td>${e(r.parties || "—")}${r.subject ? `<br><span class="muted">${e(r.subject)}</span>` : ""}</td>
      <td>${e(RELATION_STATUS_LABELS[r.status] ?? r.status)}${r.relayPaused ? ' <span class="muted">(reenvío en pausa)</span>' : ""}</td>
      <td>${r.channel === "grupo" ? "Grupo" : "Mediada"}</td>
      <td>${e(when(r.lastMessageAt))}</td>
      <td>${waiting === null ? "—" : `<span class="${late ? "error" : "muted"}">${waiting} h</span>`}</td></tr>`;
    })
        .join("");
    const empty = input.page.items.length === 0 ? `<p class="muted">No hay relaciones con ese filtro.</p>` : "";
    return `<div class="stack wide"><h1>Relaciones</h1>${flashHtml(input.flash)}
  ${tabs(input.filter, "/admin/relations", FILTERS)}
  <p class="muted">Las partes hablan solo con AutoMantPro: aquí registras lo que dice cada una y el texto listo para reenviar. El teléfono de una parte se muestra solo si autorizó compartirlo.</p>
  ${empty}
  <div class="scroll"><table><thead><tr><th>Vínculo</th><th>Tipo</th><th>Partes</th><th>Estado</th><th>Canal</th><th>Último mensaje</th><th>Espera</th></tr></thead>
  <tbody>${rows}</tbody></table></div>
  <div class="pager">${input.page.page > 1 ? `<a href="/admin/relations?f=${e(input.filter)}&amp;page=${input.page.page - 1}">← Anteriores</a>` : ""}
  ${input.page.items.length === input.page.pageSize ? `<a href="/admin/relations?f=${e(input.filter)}&amp;page=${input.page.page + 1}">Siguientes →</a>` : ""}</div></div>`;
}
function partyCard(detail, party, csrf, canSanction, sanctions) {
    const phone = party.consentShareContact && party.phone ? party.phone : null;
    const contact = phone
        ? `<div>${e(formatWhatsappNumber(phone.replace(/\D/g, "")))} · <a href="https://wa.me/${e(phone.replace(/\D/g, ""))}" target="_blank" rel="noopener">Abrir chat</a></div>`
        : `<div class="muted">Teléfono oculto: esta parte no autorizó compartirlo.</div>`;
    const active = sanctions.filter((s) => s.userId === party.userId && isActive(s));
    const sanctionNote = active.length
        ? `<p class="error">Sanción vigente: ${e(active.map((s) => sanctionLabel(s.level)).join(", "))}</p>`
        : "";
    const consent = `<form method="post" action="/admin/relations/${e(detail.relation.id)}/consent">${csrfField(csrf)}
    <input type="hidden" name="userId" value="${e(party.userId)}">
    <input type="hidden" name="consent" value="${party.consentShareContact ? "0" : "1"}">
    <button type="submit">${party.consentShareContact ? "Quitar el consentimiento" : "Registrar que autorizó compartir su número"}</button></form>`;
    const sanction = canSanction
        ? `<form method="post" action="/admin/users/${e(party.userId)}/sanctions">${csrfField(csrf)}
      <input type="hidden" name="relationshipId" value="${e(detail.relation.id)}">
      <label for="level-${e(party.userId)}">Sancionar a esta parte</label>
      <select id="level-${e(party.userId)}" name="level">${SANCTION_LEVELS.map((l) => `<option value="${e(l.key)}">${e(l.label)} — ${e(l.description)}</option>`).join("")}</select>
      <label for="days-${e(party.userId)}">Días (vacío = el valor por defecto del paso)</label>
      <input id="days-${e(party.userId)}" name="days" inputmode="numeric" value="">
      <label for="reason-${e(party.userId)}">Motivo (se le comunica)</label>
      <input id="reason-${e(party.userId)}" name="reason" maxlength="500" required>
      <button class="danger" type="submit">Aplicar sanción</button></form>`
        : "";
    return `<div class="card"><h2>${e(PARTY_ROLE_LABELS[party.role] ?? party.role)}: ${e(party.name)}</h2>
    ${contact}${sanctionNote}<p><a href="/admin/users/${e(party.userId)}">Ver ficha</a></p>${consent}${sanction}</div>`;
}
export function relationDetailView(input) {
    const { detail, csrf } = input;
    const r = detail.relation;
    const code = relationCode(r.number);
    const parties = detail.parties;
    const timeline = detail.messages.length
        ? `<ul>${detail.messages
            .map((m) => {
            const who = m.kind === "nota" ? "Nota interna" : m.fromName ? `${e(m.fromName)} → ${e(m.toName ?? "—")}` : `AutoMantPro → ${e(m.toName ?? "—")}`;
            const state = m.kind === "nota" ? "" : m.relayedAt ? ` <span class="ok">reenviado</span>` : ` <span class="muted">sin reenviar</span>`;
            return `<li><strong>${who}</strong>${state} <span class="muted">${e(when(m.createdAt))}</span><br>${e(m.body)}</li>`;
        })
            .join("")}</ul>`
        : `<p class="muted">Todavía no hay mensajes en este vínculo.</p>`;
    const transitions = (RELATION_TRANSITIONS[r.status] ?? [])
        .map((next) => `<option value="${e(next)}">${e(RELATION_STATUS_LABELS[next])}</option>`)
        .join("");
    const statusForm = transitions
        ? `<form method="post" action="/admin/relations/${e(r.id)}/status">${csrfField(csrf)}
      <label for="status">Cambiar el estado</label><select id="status" name="status">${transitions}</select>
      <label for="status-reason">Motivo (obligatorio al cerrar o bloquear)</label><input id="status-reason" name="reason" maxlength="191">
      <button type="submit">Guardar estado</button></form>`
        : `<p class="muted">Este vínculo no admite más cambios de estado.</p>`;
    const relayForm = `<form method="post" action="/admin/relations/${e(r.id)}/message">${csrfField(csrf)}
    <label for="from">Quién lo dijo</label>
    <select id="from" name="fromUserId">
      <option value="">AutoMantPro (mensaje propio del panel)</option>
      ${parties.map((p) => `<option value="${e(p.userId)}">${e(p.name)} (${e(PARTY_ROLE_LABELS[p.role] ?? p.role)})</option>`).join("")}
    </select>
    <label for="to">Para</label>
    <select id="to" name="toUserId">
      ${parties.map((p) => `<option value="${e(p.userId)}">${e(p.name)}</option>`).join("")}
      <option value="">Solo registrar (nota interna, no se reenvía)</option>
    </select>
    <label for="body">Mensaje</label><textarea id="body" name="body" rows="4" maxlength="2000" required></textarea>
    <button class="full" type="submit">Registrar y preparar el reenvío</button></form>`;
    const relayBox = input.relay
        ? `<div class="card"><h2>Listo para enviar a ${e(input.relay.to)}</h2>
      <p class="muted">Cópialo y envíalo desde WhatsApp Business. Ya quedó registrado en el vínculo.</p>
      <textarea readonly rows="7">${e(input.relay.text)}</textarea></div>`
        : "";
    const allowed = groupAllowed(parties);
    const groupCard = `<div class="card"><h2>Grupo de WhatsApp (excepción)</h2>
    ${r.channel === "grupo" && r.groupInviteUrl
        ? `<p class="ok">Grupo aprobado.</p><p><a href="${e(r.groupInviteUrl)}" target="_blank" rel="noopener">Abrir el grupo</a></p>
         <form method="post" action="/admin/relations/${e(r.id)}/group">${csrfField(csrf)}<input type="hidden" name="remove" value="1">
         <button class="danger" type="submit">Volver a conversación mediada</button></form>`
        : allowed
            ? `<p class="muted">Ambas partes autorizaron compartir su número. Crea el grupo en WhatsApp Business y pega aquí el enlace de invitación.</p>
           <form method="post" action="/admin/relations/${e(r.id)}/group">${csrfField(csrf)}
           <label for="invite">Enlace de invitación</label><input id="invite" name="inviteUrl" placeholder="https://chat.whatsapp.com/..." required>
           <button type="submit">Aprobar el grupo</button></form>`
            : `<p class="muted">Falta el consentimiento de alguna parte: mientras tanto, la conversación sigue mediada.</p>`}
  </div>`;
    const disputeForm = input.canDispute
        ? `<form method="post" action="/admin/relations/${e(r.id)}/dispute">${csrfField(csrf)}
      <label for="claimant">Quién reclama</label>
      <select id="claimant" name="claimantUserId">${parties.map((p) => `<option value="${e(p.userId)}">${e(p.name)}</option>`).join("")}</select>
      <label for="against">Contra</label>
      <select id="against" name="againstUserId">${parties.map((p) => `<option value="${e(p.userId)}">${e(p.name)}</option>`).join("")}</select>
      <label for="dispute-reason">Motivo del reclamo</label><textarea id="dispute-reason" name="reason" rows="3" maxlength="2000" required></textarea>
      <button type="submit">Abrir disputa</button></form>`
        : `<p class="muted">Tu rol no abre disputas.</p>`;
    const disputeList = detail.disputes.length
        ? `<ul>${detail.disputes
            .map((d) => `<li><a href="/admin/disputes?f=todas">${e(disputeCode(d.number))}</a> · ${e(d.status)} · ${e(d.reason.slice(0, 120))}</li>`)
            .join("")}</ul>`
        : "";
    return `<div class="stack wide"><h1>${e(code)} · ${e(RELATION_KIND_LABELS[r.kind] ?? r.kind)}</h1>
  ${flashHtml(input.flash)}
  <div class="card"><h2>Resumen</h2>
    <div>Estado: <strong>${e(RELATION_STATUS_LABELS[r.status] ?? r.status)}</strong>${r.closeReason ? ` <span class="muted">(${e(r.closeReason)})</span>` : ""}</div>
    <div>Canal: <strong>${r.channel === "grupo" ? "Grupo" : "Conversación mediada"}</strong>${r.relayPaused ? ' · <span class="error">reenvío en pausa</span>' : ""}</div>
    <div>Origen: ${e(r.originType)}${r.subject ? ` · ${e(r.subject)}` : ""}</div>
    <div>Creado: ${e(when(r.createdAt))} · Último mensaje: ${e(when(r.lastMessageAt))}</div>
    ${statusForm}
    <form method="post" action="/admin/relations/${e(r.id)}/relay">${csrfField(csrf)}
    <input type="hidden" name="paused" value="${r.relayPaused ? "0" : "1"}">
    <button type="submit">${r.relayPaused ? "Reanudar el reenvío" : "Pausar el reenvío"}</button></form>
  </div>
  ${relayBox}
  ${parties.map((p) => partyCard(detail, p, csrf, input.canSanction, input.sanctions)).join("")}
  <div class="card"><h2>Conversación</h2>${timeline}${r.relayPaused ? `<p class="error">El reenvío está en pausa: los mensajes quedan registrados pero no se envían.</p>` : ""}${relayForm}</div>
  ${groupCard}
  <div class="card"><h2>Disputas</h2>${disputeList}${disputeForm}</div>
  </div>`;
}
export function disputesListView(input) {
    const rows = input.page.items
        .map((d) => {
        const resolve = input.canResolve && (d.status === "abierta" || d.status === "en_revision")
            ? `<form method="post" action="/admin/disputes/${e(d.id)}/resolve">${csrfField(input.csrf)}
            <label for="res-${e(d.id)}">Resolución</label><textarea id="res-${e(d.id)}" name="resolution" rows="2" maxlength="2000" required></textarea>
            <select name="status"><option value="resuelta">Resuelta</option><option value="en_revision">En revisión</option><option value="rechazada">Rechazada</option></select>
            <button type="submit">Guardar</button></form>`
            : d.resolution
                ? `<span class="muted">${e(d.resolution.slice(0, 160))}</span>`
                : "";
        return `<tr><td>${e(disputeCode(d.number))}</td>
      <td>${d.relationshipId ? `<a href="/admin/relations/${e(d.relationshipId)}">VN-${e(String(d.relationNumber ?? "").padStart(5, "0"))}</a>` : "—"}</td>
      <td>${e(d.claimantName ?? "—")} → ${e(d.againstName ?? "—")}</td>
      <td>${e(d.reason.slice(0, 200))}</td>
      <td>${e(d.status)}<br><span class="muted">${e(when(d.createdAt))}</span></td>
      <td>${resolve}</td></tr>`;
    })
        .join("");
    return `<div class="stack wide"><h1>Disputas</h1>${flashHtml(input.flash)}
  ${tabs(input.filter, "/admin/disputes", DISPUTE_FILTERS)}
  ${input.page.items.length === 0 ? `<p class="muted">No hay disputas con ese filtro.</p>` : ""}
  <div class="scroll"><table><thead><tr><th>Caso</th><th>Vínculo</th><th>Partes</th><th>Motivo</th><th>Estado</th><th>Resolución</th></tr></thead>
  <tbody>${rows}</tbody></table></div></div>`;
}
export function sanctionsListView(input) {
    const rows = input.page.items
        .map((s) => {
        const state = s.liftedAt
            ? `<span class="muted">levantada ${e(when(s.liftedAt))}</span>`
            : isActive(s)
                ? `<span class="error">vigente${s.endsAt ? ` hasta ${e(when(s.endsAt))}` : ""}</span>`
                : `<span class="muted">vencida</span>`;
        const lift = input.canLift && !s.liftedAt && isActive(s)
            ? `<form method="post" action="/admin/sanctions/${e(s.id)}/lift">${csrfField(input.csrf)}
            <label for="lift-${e(s.id)}">Motivo para levantarla</label><input id="lift-${e(s.id)}" name="reason" maxlength="191" required>
            <button type="submit">Levantar</button></form>`
            : s.liftReason
                ? `<span class="muted">${e(s.liftReason)}</span>`
                : "";
        return `<tr><td><a href="/admin/users/${e(s.userId)}">${e(s.userName ?? s.userId)}</a></td>
      <td>${e(sanctionLabel(s.level))}</td><td>${e(s.reason.slice(0, 200))}</td>
      <td>${e(when(s.startsAt))}<br>${state}</td><td>${lift}</td></tr>`;
    })
        .join("");
    const ladder = SANCTION_LEVELS.map((l) => `<li><strong>${e(l.label)}:</strong> ${e(l.description)}${l.defaultDays ? ` (por defecto ${l.defaultDays} días)` : ""}</li>`).join("");
    return `<div class="stack wide"><h1>Sanciones</h1>${flashHtml(input.flash)}
  <div class="card"><h2>La escala</h2><ol>${ladder}</ol>
  <p class="muted">Siempre con motivo, aviso a la entidad y registro en la auditoría. Se aplican desde el vínculo o desde la ficha de la persona.</p></div>
  ${input.page.items.length === 0 ? `<p class="muted">Todavía no hay sanciones registradas.</p>` : ""}
  <div class="scroll"><table><thead><tr><th>Entidad</th><th>Paso</th><th>Motivo</th><th>Vigencia</th><th>Levantar</th></tr></thead>
  <tbody>${rows}</tbody></table></div></div>`;
}
/** Texto listo para reenviar a la otra parte. */
export { relayMessage };
//# sourceMappingURL=views-relations.js.map