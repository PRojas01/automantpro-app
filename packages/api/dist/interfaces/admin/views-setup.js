import { escapeHtml } from "../entry/page.js";
const flashHtml = (flash) => flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${escapeHtml(flash.text)}</p>` : "";
const csrfField = (token) => `<input type="hidden" name="csrf" value="${escapeHtml(token)}">`;
function enrollment(t, action, csrf, button) {
    return `<p>Abre tu app de autenticación (Google Authenticator, Microsoft Authenticator o Authy) y escanea este código:</p>
  <div class="qr">${t.qrSvg}</div>
  <p class="muted">¿No puedes escanear? Ingresa esta clave manualmente: <code id="totp-secret">${escapeHtml(t.secret)}</code></p>
  <p><a href="${escapeHtml(t.uri)}">Abrir directamente en la app del teléfono</a></p>
  <form method="post" action="${action}" autocomplete="off">${csrfField(csrf)}
  <label for="code">Escribe el código de 6 dígitos que muestra la app</label>
  <input id="code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code">
  <button class="full" type="submit">${escapeHtml(button)}</button></form>`;
}
export function setupView(input) {
    const title = `<h1 class="brand">Auto<span>Mant</span>Pro · Puesta en marcha</h1>`;
    if (input.kind === "no-db") {
        return `<div class="stack">${title}<div class="card"><p class="error">La base de datos no está configurada.</p>
    <p>Revisa en GoDaddy que existan DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD y vuelve a publicar.</p></div></div>`;
    }
    if (input.kind === "db-error") {
        return `<div class="stack">${title}<div class="card"><p class="error">No se pudo conectar a la base de datos${input.code ? ` (${escapeHtml(input.code)})` : ""}.</p><p>Espera un minuto y recarga la página.</p></div></div>`;
    }
    const ready = input.present >= input.total;
    const csrf = csrfField(input.csrf);
    const step1 = ready
        ? `<p class="ok">Base de datos lista (${input.present} de ${input.total} tablas).</p>`
        : `<p>${input.present} de ${input.total} tablas listas.</p>
       <form method="post" action="/admin/setup/schema">${csrf}<button type="submit">Crear tablas</button></form>`;
    let step2;
    if (!ready)
        step2 = `<p class="muted">Primero crea las tablas.</p>`;
    else if (input.pending)
        step2 = `<p class="ok">Cuenta preparada para ${escapeHtml(input.pending.email)}.</p>`;
    else
        step2 = `<form method="post" action="/admin/setup/account" autocomplete="on">${csrf}
      <label for="email">Correo</label><input id="email" name="email" type="email" value="admin@automantpro.app" required autocomplete="username">
      <label for="name">Nombre</label><input id="name" name="name" value="Administrador" required minlength="3" maxlength="60" autocomplete="name">
      <label for="password">Contraseña (mínimo 12 caracteres)</label><input id="password" name="password" type="password" required minlength="12" autocomplete="new-password">
      <label for="confirm">Repite la contraseña</label><input id="confirm" name="confirm" type="password" required minlength="12" autocomplete="new-password">
      <button class="full" type="submit">Continuar</button></form>`;
    const step3 = input.pending
        ? enrollment(input.pending, "/admin/setup/confirm", input.csrf, "Activar y entrar al panel")
        : `<p class="muted">Completa el paso 2.</p>`;
    return `<div class="stack">${title}
  <p class="muted">Este asistente solo está disponible mientras no exista una cuenta de administrador.</p>
  ${flashHtml(input.flash)}
  <div class="card"><h2>Paso 1 · Tablas de la base de datos</h2>${step1}</div>
  <div class="card"><h2>Paso 2 · Tu cuenta de administrador</h2>${step2}</div>
  <div class="card"><h2>Paso 3 · Segundo factor</h2>${step3}</div>
  </div>`;
}
export function accountView(input) {
    const csrf = csrfField(input.csrf);
    const current = (id) => `<label for="${id}">Contraseña actual</label><input id="${id}" name="current" type="password" required autocomplete="current-password">`;
    const totp = input.totp
        ? enrollment(input.totp, "/admin/account/totp/confirm", input.csrf, "Confirmar nuevo dispositivo")
        : `<p class="muted">Úsalo si cambiaste de teléfono o de app de autenticación.</p>
       <form method="post" action="/admin/account/totp/start">${csrf}${current("current-totp")}
       <button class="full" type="submit">Cambiar segundo factor</button></form>`;
    return `<div class="stack"><h1>Mi cuenta</h1>${flashHtml(input.flash)}
  <div class="card"><h2>Datos</h2>
    <form method="post" action="/admin/account/profile">${csrf}
    <label for="name">Nombre</label><input id="name" name="name" value="${escapeHtml(input.name)}" required minlength="3" maxlength="60">
    <label for="email">Correo</label><input id="email" name="email" type="email" value="${escapeHtml(input.email)}" required autocomplete="username">
    ${current("current-profile")}
    <button class="full" type="submit">Guardar datos</button></form></div>
  <div class="card"><h2>Contraseña</h2>
    <form method="post" action="/admin/account/password">${csrf}${current("current-password")}
    <label for="password">Nueva contraseña (mínimo 12 caracteres)</label><input id="password" name="password" type="password" required minlength="12" autocomplete="new-password">
    <label for="confirm">Repite la nueva contraseña</label><input id="confirm" name="confirm" type="password" required minlength="12" autocomplete="new-password">
    <button class="full" type="submit">Cambiar contraseña</button></form></div>
  <div class="card"><h2>Segundo factor</h2>${totp}</div>
  </div>`;
}
//# sourceMappingURL=views-setup.js.map