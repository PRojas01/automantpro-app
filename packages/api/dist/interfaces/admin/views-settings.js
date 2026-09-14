import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
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
  <div class="card"><h2>Base de datos</h2>${db}</div>
  </div>`;
}
//# sourceMappingURL=views-settings.js.map