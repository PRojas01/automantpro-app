import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { LEGAL_FIELDS, LEGAL_VERSION, isLegalComplete } from "../../application/legal/documents.js";
import { FEATURES, inQuietHours } from "../../application/settings/platform.js";
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
  ${platformCard(input.platform, csrf)}
  ${aiCard(input.ai, csrf)}
  ${legalCard(input.legal, csrf)}
  <div class="card"><h2>Base de datos</h2>${db}</div>
  </div>`;
}
/** Operación de la plataforma (docs/35 A2): ciudades, horario silencioso, bienvenida e interruptores. */
function platformCard(platform, csrf) {
    if (!platform)
        return "";
    const quiet = inQuietHours(platform)
        ? `<p class="error">Ahora mismo estás en horario silencioso.</p>`
        : platform.quietFrom && platform.quietTo
            ? `<p class="ok">Horario silencioso configurado de ${escapeHtml(platform.quietFrom)} a ${escapeHtml(platform.quietTo)}.</p>`
            : `<p class="muted">Sin horario silencioso: el panel no avisa a ninguna hora.</p>`;
    const switches = FEATURES.map((f) => `<label><input type="checkbox" name="feature_${escapeHtml(f.key)}"${platform.features[f.key] ? " checked" : ""}> ${escapeHtml(f.label)}</label>`).join("");
    const entry = `<p class="muted">Cómo abre automantpro.app:</p>
    <label class="choice"><input type="radio" name="entryMode" value="directo"${platform.entryMode === "menu" ? "" : " checked"}>
      <span><strong>Directo al chat</strong><br>Un solo salto a WhatsApp. Mejor para tarjetas, QR y el número compartido.</span></label>
    <label class="choice"><input type="radio" name="entryMode" value="menu"${platform.entryMode === "menu" ? " checked" : ""}>
      <span><strong>Menú de perfiles</strong><br>Muestra la página con «tengo un vehículo», «tengo un taller», «tengo un almacén» y «ya tengo cuenta»; el chat arranca con esa respuesta escrita. Mejor para campañas.</span></label>`;
    return `<div class="card"><h2>Operación</h2>${quiet}
    <form method="post" action="/admin/settings/platform" autocomplete="off">${csrf}
    ${entry}
    <label for="cities">Ciudades activas (separadas por comas; vacío = todas)</label>
    <input id="cities" name="cities" value="${escapeHtml(platform.cities.join(", "))}" placeholder="Quito, Guayaquil, Cuenca">
    <label for="quietFrom">Horario silencioso desde</label>
    <input id="quietFrom" name="quietFrom" placeholder="21:00" value="${escapeHtml(platform.quietFrom ?? "")}">
    <label for="quietTo">Hasta</label>
    <input id="quietTo" name="quietTo" placeholder="07:00" value="${escapeHtml(platform.quietTo ?? "")}">
    <label for="welcomeIntro">Línea extra en la bienvenida (opcional)</label>
    <input id="welcomeIntro" name="welcomeIntro" maxlength="300" value="${escapeHtml(platform.welcomeIntro ?? "")}" placeholder="Estamos en pruebas gratuitas hasta diciembre.">
    <p class="muted">Funciones encendidas:</p><div class="checks">${switches}</div>
    <label for="current-platform">Tu contraseña actual</label>
    <input id="current-platform" name="current" type="password" required autocomplete="current-password">
    <button class="full" type="submit">Guardar operación</button></form></div>`;
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
function aiCard(ai, csrf) {
    if (ai === undefined)
        return "";
    if (ai === null)
        return `<div class="card"><h2>Copiloto de IA</h2><p class="error">No se pudo consultar el estado de la IA.</p></div>`;
    const configured = ai.missing.length === 0;
    const status = ai.available
        ? `<p class="ok">Disponible para los operadores.</p>`
        : `<p class="error">${escapeHtml(ai.reason ?? "No disponible.")}</p>`;
    const spent = ai.spentTodayUsd === null ? "—" : `US$ ${ai.spentTodayUsd.toFixed(4)}`;
    const feedback = ai.feedback ? `${ai.feedback.good} útiles · ${ai.feedback.bad} no sirvieron (últimos 30 días)` : "—";
    return `<div class="card"><h2>Copiloto de IA</h2>${status}
    <div>Proveedor: <strong>${escapeHtml(ai.provider ?? "sin configurar")}</strong>${ai.model ? ` · modelo <strong>${escapeHtml(ai.model)}</strong>` : ""}</div>
    <div>Gasto de hoy: <strong>${escapeHtml(spent)}</strong> de US$ ${escapeHtml(ai.budgetUsd.toFixed(2))}</div>
    <div>Valoraciones: ${escapeHtml(feedback)}</div>
    ${configured ? "" : `<p class="muted">Configura en los secretos de GoDaddy: LLM_PROVIDER (openai o anthropic), LLM_API_KEY y LLM_MODEL_SMART; luego vuelve a publicar.</p>`}
    ${ai.pricesDefaulted ? `<p class="muted">Sin precios configurados: el gasto se estima con valores altos. Define LLM_PRICE_INPUT_PER_MTOK y LLM_PRICE_OUTPUT_PER_MTOK con los precios de tu modelo.</p>` : ""}
    <form method="post" action="/admin/settings/ai" autocomplete="off">${csrf}
    <div class="checks"><label><input type="checkbox" name="enabled"${ai.enabled ? " checked" : ""}> IA encendida</label></div>
    <label for="ai-budget">Tope diario (US$)</label><input id="ai-budget" name="budget" inputmode="decimal" value="${escapeHtml(String(ai.budgetUsd).replace(".", ","))}" required>
    <label for="current-ai">Tu contraseña actual</label><input id="current-ai" name="current" type="password" required autocomplete="current-password">
    <button class="full" type="submit">Guardar IA</button></form></div>`;
}
//# sourceMappingURL=views-settings.js.map