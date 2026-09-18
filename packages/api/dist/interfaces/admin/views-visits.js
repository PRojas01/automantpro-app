import { escapeHtml as e } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { ENTRY_PROFILES } from "../entry/page.js";
// Bandeja de origen (docs/43): qué código llegó por dónde, quién escribió y quién se registró.
function when(value) {
    if (!value)
        return "—";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short", timeZone: "America/Guayaquil" }).format(date);
}
const PROFILE_LABELS = Object.fromEntries(ENTRY_PROFILES.map((p) => [p.key, p.label]));
/** El teléfono solo se muestra entero si ya hay un usuario registrado detrás. */
function phoneCell(visit) {
    if (!visit.phone)
        return `<span class="muted">todavía no escribe</span>`;
    const digits = visit.phone.replace(/\D/g, "");
    if (visit.userId)
        return e(formatWhatsappNumber(digits));
    return `<span class="muted">···${e(digits.slice(-4))}</span>`;
}
export function visitsView(input) {
    const filas = input.items
        .map((v) => `<tr><td><code>${e(v.code)}</code></td>
      <td>${e(v.ref ?? "—")}</td>
      <td>${e(v.profile ? (PROFILE_LABELS[v.profile] ?? v.profile) : "—")}</td>
      <td>${phoneCell(v)}</td>
      <td>${v.userId ? `<a href="/admin/users/${e(v.userId)}">${e(v.userName ?? "ver ficha")}</a>` : `<span class="muted">sin registrar</span>`}</td>
      <td>${e(when(v.createdAt))}</td></tr>`)
        .join("");
    const resumen = input.stats
        .map((s) => {
        const conv = s.visitas > 0 ? Math.round((s.registrados / s.visitas) * 100) : 0;
        return `<tr><td>${e(s.ref ?? "directo")}</td>
      <td>${e(s.profile ? (PROFILE_LABELS[s.profile] ?? s.profile) : "sin elegir")}</td>
      <td>${s.visitas}</td><td>${s.escribieron}</td><td>${s.registrados}</td><td>${conv}%</td></tr>`;
    })
        .join("");
    return `<div class="stack wide"><h1>Origen de los contactos</h1>
  <div class="card"><h2>Qué es el código</h2>
    <p class="muted">Cada visita a automantpro.app recibe un código <code>AMP-XXXXX</code> único que viaja en el primer mensaje de WhatsApp. Cuando la persona escribe, el código queda ligado a su número; cuando se registra, queda ligado a su ficha. Así se sabe de dónde llegó cada usuario sin pedirle nada.</p></div>
  <div class="card"><h2>Resumen de los últimos ${input.days} días</h2>
    ${input.stats.length === 0 ? `<p class="muted">Todavía no hay visitas registradas.</p>` : ""}
    <div class="scroll"><table><thead><tr><th>Origen</th><th>Opción elegida</th><th>Visitas</th><th>Escribieron</th><th>Se registraron</th><th>Conversión</th></tr></thead>
    <tbody>${resumen}</tbody></table></div></div>
  <div class="scroll"><table><thead><tr><th>Código</th><th>Origen</th><th>Opción</th><th>Teléfono</th><th>Usuario</th><th>Visita</th></tr></thead>
  <tbody>${filas}</tbody></table></div></div>`;
}
//# sourceMappingURL=views-visits.js.map