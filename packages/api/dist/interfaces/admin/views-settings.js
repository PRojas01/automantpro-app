import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { LEGAL_FIELDS, LEGAL_VERSION, isLegalComplete } from "../../application/legal/documents.js";
// Vista de Ajustes (/admin/settings).
export function settingsView(input) {
    const csrf = `<input type="hidden" name="csrf" value="${escapeHtml(input.csrf)}">`;
    const effective = input.whatsapp.stored ?? input.whatsapp.env;
    const origin = input.whatsapp.stored
        ? "configurado en este panel"
        : input.whatsapp.env
            ? "tomado del secreto WA_PUBLIC_NUMBER de GoDaddy"
            : "sin configurar: la página de inicio muestra «Muy pronto»";
    const current = effective
        ? `<p>Número en uso: <strong>${escapeHtml(formatWhatsappNumber(effective))}</strong> <span class="muted">(${origin})</span></p>
       <p><a href="https://wa.me/${escapeHtml(effective)}" rel="noopener" target="_blank">Probar el enlace de WhatsApp</a></p>`
        : `<p class="error">${origin}</p>`;
    const remove = input.whatsapp.stored
        ? `<button type="submit" name="action" value="remove">Quitar y usar el secreto de GoDaddy</button>`
        : "";
    const flash = input.flash
        ? `<p class="${input.flash.kind === "ok" ? "ok" : "error"}" role="status">${escapeHtml(input.flash.text)}</p>`
        : "";
    const db = input.db
        ? input.db.present >= input.db.total
            ? `<p class="ok">Base de datos al día (${input.db.present} de ${input.db.total} tablas).</p>`
            : `<p>${input.db.present} de ${input.db.total} tablas. Hay actualizaciones pendientes.</p>
         <form method="post" action="/admin/settings/schema">${csrf}<button type="submit">Aplicar actualizaciones</button></form>`
        : `<p class="error">No se pudo consultar la base de datos.</p>`;
    return `<div class="stack"><h1>Ajustes</h1>${flash}
  <div class="card"><h2>Número público de WhatsApp</h2>${current}
    <form method="post" action="/admin/settings/whatsapp" autocomplete="off">${csrf}
    <label for="number">Nuevo número</label>
    <input id="number" name="number" inputmode="tel" placeholder="099 123 4567 o +593 99 123 4567" value="">
    <p class="muted">Es el número al que la página automantpro.app envía a los visitantes. Se aplica en menos de un minuto.</p>
    <label for="current-settings">Tu contraseña actual</label>
    <input id="current-settings" name="current" type="password" required autocomplete="current-password">
    <button class="full" type="submit" name="action" value="save">Guardar número</button>
    ${remove}</form></div>
  ${legalCard(input.legal, csrf)}
  <div class="card"><h2>Base de datos</h2>${db}</div>
  </div>`;
}
function legalCard(legal, csrf) {
    if (!legal)
        return "";
    const status = isLegalComplete(legal)
        ? `<p class="ok">Datos completos. Versión ${escapeHtml(LEGAL_VERSION)} publicada.</p>`
        : `<p class="error">Faltan datos: las páginas muestran «[pendiente]» y un aviso de documento en revisión.</p>`;
    const inputs = LEGAL_FIELDS.map((f) => `<label for="legal-${f.key}">${escapeHtml(f.label)}</label><input id="legal-${f.key}" name="${f.key}" value="${escapeHtml(legal[f.key] ?? "")}" placeholder="${escapeHtml(f.placeholder)}" maxlength="200">`).join("");
    return `<div class="card"><h2>Datos de la empresa para términos y privacidad</h2>${status}
    <p><a href="/terminos" target="_blank" rel="noopener">Ver términos y condiciones</a> · <a href="/privacidad" target="_blank" rel="noopener">Ver política de privacidad</a></p>
    <p class="muted">Confirma con tu abogado la razón social y el tipo de empresa antes de completarlos.</p>
    <form method="post" action="/admin/settings/legal" autocomplete="off">${csrf}${inputs}
    <label for="current-legal">Tu contraseña actual</label><input id="current-legal" name="current" type="password" required autocomplete="current-password">
    <button class="full" type="submit">Guardar datos de la empresa</button></form></div>`;
}
//# sourceMappingURL=views-settings.js.map