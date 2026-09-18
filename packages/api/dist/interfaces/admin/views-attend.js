import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { formatEcDateTime } from "../../application/appointments/messages.js";
import { ROLE_LABELS } from "./views-registrations.js";
const e = (value) => escapeHtml(value === null || value === undefined ? "" : String(value));
const csrfField = (token) => `<input type="hidden" name="csrf" value="${e(token)}">`;
const phoneDigits = (phone) => phone.replace(/\D/g, "");
function visitLine(result) {
    if (!result.code)
        return "";
    if (result.visit) {
        return `<div>🌐 Llegó desde automantpro.app el ${e(formatEcDateTime(result.visit.createdAt))}${result.visit.ref ? ` · origen: <strong>${e(result.visit.ref)}</strong>` : ""} (código ${e(result.code)}).</div>`;
    }
    return `<div class="muted">El código ${e(result.code)} ${result.visitLookup ? "no corresponde a una visita de los últimos 7 días" : "no se pudo consultar"}.</div>`;
}
const INTENT_LABELS = {
    dueno: "Dijo que tiene un vehículo",
    taller: "Dijo que tiene un taller",
    almacen: "Dijo que tiene un almacén de repuestos",
    cuenta: "Dijo que ya tiene cuenta (escribe desde otro número)",
};
function resultCard(result, csrf) {
    if (!result.phone) {
        return `<div class="card">${visitLine(result)}<p class="error">No encontré un celular de Ecuador en lo que pegaste. Pega el número del contacto (por ejemplo 099 123 4567).</p></div>`;
    }
    const digits = phoneDigits(result.phone);
    const chat = `<a href="https://wa.me/${e(digits)}" target="_blank" rel="noopener">Abrir chat</a>`;
    const message = `<label for="welcome">Mensaje para enviar</label><textarea id="welcome" readonly rows="10">${e(result.message)}</textarea>`;
    if (!result.detail) {
        const intent = result.intent ?? null;
        const intentLine = intent ? `<p class="ok">${e(INTENT_LABELS[intent] ?? intent)}.</p>` : "";
        const option = (value, label) => `<option value="${value}"${intent === value ? " selected" : ""}>${label}</option>`;
        return `<div class="card"><h2>Contacto nuevo</h2>
      <div><strong>${e(formatWhatsappNumber(digits))}</strong> · ${chat}</div>${visitLine(result)}${intentLine}
      <p class="muted">${intent === "cuenta" ? "Dice que ya tiene cuenta: búscala por su número anterior antes de registrarlo de nuevo." : "No está registrado. Envía la bienvenida y, cuando diga quién es, regístralo."}</p>
      ${message}
      <form method="post" action="/admin/users/new/start" class="row">${csrfField(csrf)}<input type="hidden" name="phone" value="${e(result.phone)}">
      <select name="perfil" aria-label="Perfil">${option("dueno", "Dueño de vehículo")}${option("taller", "Taller")}${option("almacen", "Almacén")}</select>
      <button type="submit">Registrar</button></form></div>`;
    }
    const { user, vehicles } = result.detail;
    const role = String(user.role);
    const tasks = result.tasks.length === 0
        ? `<p class="muted">Sin pendientes.</p>`
        : `<ul>${result.tasks.map((t) => `<li>${e(t.text)}${t.forCustomer ? "" : ' <span class="muted">(solo para ti)</span>'}</li>`).join("")}</ul>`;
    const schedule = role === "dueno" && vehicles[0]
        ? ` · <a href="/admin/users/${e(user.id)}/schedule?vehicleId=${e(vehicles[0].id)}">Agendar turno</a>`
        : "";
    return `<div class="card"><h2>${e(ROLE_LABELS[role] ?? role)} registrado</h2>
    <div><strong>${e(user.name)}</strong> · ${e(formatWhatsappNumber(digits))} · ${chat}</div>${visitLine(result)}
    <div><a href="/admin/users/${e(user.id)}">Ver ficha</a>${schedule}</div>
    <h2>Pendientes del último chat</h2>${tasks}
    ${message}</div>`;
}
function copilotCard(input) {
    const { csrf, copilot, draft } = input;
    const hiddenQuery = `<input type="hidden" name="q" value="${e(input.query)}">`;
    let draftBlock = "";
    if (draft?.ok) {
        const feedback = draft.usageId
            ? `<form method="post" action="/admin/attend/feedback" class="row">${csrfField(csrf)}${hiddenQuery}<input type="hidden" name="usageId" value="${e(draft.usageId)}">
        <input name="reason" maxlength="191" placeholder="¿Qué le faltó o sobró? (opcional)">
        <button type="submit" name="score" value="good">👍 Útil</button><button class="danger" type="submit" name="score" value="bad">👎 No sirvió</button></form>`
            : "";
        draftBlock = `<p class="muted">Borrador generado por IA: revísalo y corrígelo antes de enviarlo. Costo estimado US$ ${e(draft.costUsd.toFixed(4))}.</p>
      <label for="draft">Borrador de la IA</label><textarea id="draft" rows="10">${e(draft.reply)}</textarea>
      ${draft.note ? `<p><strong>Nota para ti:</strong> ${e(draft.note)}</p>` : ""}${feedback}`;
    }
    else if (draft) {
        draftBlock = `<p class="error" role="alert">${e(draft.message)}</p><p class="muted">Usa el mensaje sugerido de arriba.</p>`;
    }
    const form = copilot.available
        ? `<form method="post" action="/admin/attend/draft" autocomplete="off">${csrfField(csrf)}${hiddenQuery}
      <label for="customer-message">Mensaje del cliente</label><textarea id="customer-message" name="message" rows="4" maxlength="2000" required>${e(input.customerText)}</textarea>
      <label for="instruction">Indicación para la IA (opcional)</label><input id="instruction" name="instruction" maxlength="300" value="${e(input.instruction)}" placeholder="Ofrécele turno para el jueves en la mañana">
      <button class="full" type="submit">Sugerir respuesta con IA</button></form>`
        : `<p class="muted">${e(copilot.reason ?? "La IA no está disponible.")} Revísalo en <a href="/admin/settings">Ajustes</a>.</p>`;
    return `<div class="card"><h2>Copiloto de IA</h2>${draftBlock}${form}</div>`;
}
export function attendView(input) {
    return `<div class="stack wide"><h1>Atender a un contacto</h1>
  ${input.notice ? `<div class="card"><p class="error" role="status">${e(input.notice)}</p></div>` : ""}
  <p class="muted">Pega el número o el primer mensaje que llegó por WhatsApp. Te digo si es nuevo o registrado, su perfil, lo pendiente y el mensaje para responder.</p>
  ${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
  <form method="post" action="/admin/attend" autocomplete="off">${csrfField(input.csrf)}
  <label for="q">Número o mensaje</label><textarea id="q" name="q" rows="3" maxlength="2000" required placeholder="Hola AutoMantPro, quiero empezar. Código: AMP-XXXX · 099 123 4567">${e(input.query)}</textarea>
  <button class="full" type="submit">Identificar</button></form>
  ${input.flash ? `<p class="ok" role="status">${e(input.flash)}</p>` : ""}
  ${input.result ? resultCard(input.result, input.csrf) : ""}
  ${input.result?.phone && input.copilot
        ? copilotCard({ csrf: input.csrf, query: input.query, copilot: input.copilot, draft: input.draft, customerText: input.customerText ?? input.query, instruction: input.instruction ?? "" })
        : ""}</div>`;
}
//# sourceMappingURL=views-attend.js.map