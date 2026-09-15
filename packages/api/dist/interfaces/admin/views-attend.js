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
function resultCard(result, csrf) {
    if (!result.phone) {
        return `<div class="card">${visitLine(result)}<p class="error">No encontré un celular de Ecuador en lo que pegaste. Pega el número del contacto (por ejemplo 099 123 4567).</p></div>`;
    }
    const digits = phoneDigits(result.phone);
    const chat = `<a href="https://wa.me/${e(digits)}" target="_blank" rel="noopener">Abrir chat</a>`;
    const message = `<label for="welcome">Mensaje para enviar</label><textarea id="welcome" readonly rows="10">${e(result.message)}</textarea>`;
    if (!result.detail) {
        return `<div class="card"><h2>Contacto nuevo</h2>
      <div><strong>${e(formatWhatsappNumber(digits))}</strong> · ${chat}</div>${visitLine(result)}
      <p class="muted">No está registrado. Envía la bienvenida y, cuando diga quién es, regístralo.</p>
      ${message}
      <form method="post" action="/admin/users/new/start" class="row">${csrfField(csrf)}<input type="hidden" name="phone" value="${e(result.phone)}">
      <select name="perfil" aria-label="Perfil"><option value="dueno">Dueño de vehículo</option><option value="taller">Taller</option><option value="almacen">Almacén</option></select>
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
export function attendView(input) {
    return `<div class="stack wide"><h1>Atender a un contacto</h1>
  <p class="muted">Pega el número o el primer mensaje que llegó por WhatsApp. Te digo si es nuevo o registrado, su perfil, lo pendiente y el mensaje para responder.</p>
  ${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
  <form method="post" action="/admin/attend" autocomplete="off">${csrfField(input.csrf)}
  <label for="q">Número o mensaje</label><textarea id="q" name="q" rows="3" maxlength="2000" required placeholder="Hola AutoMantPro, quiero empezar. Código: AMP-XXXX · 099 123 4567">${e(input.query)}</textarea>
  <button class="full" type="submit">Identificar</button></form>
  ${input.result ? resultCard(input.result, input.csrf) : ""}</div>`;
}
//# sourceMappingURL=views-attend.js.map