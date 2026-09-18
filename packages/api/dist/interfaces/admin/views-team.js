import { escapeHtml } from "../entry/page.js";
import { STAFF_ROLES, capabilitiesOf, normalizeRole, roleLabel } from "../../application/admin/permissions.js";
// Vistas del equipo (/admin/team) y del registro del segundo factor en el primer ingreso.
const CAPABILITY_LABELS = {
    read: "consultar",
    attend: "atender",
    registrations: "registrar",
    verifications: "verificar",
    appointments: "turnos",
    workorders: "órdenes",
    quotes: "cotizaciones",
    notes: "notas",
    settings: "ajustes",
    team: "equipo",
};
function roleOptions(selected) {
    return STAFF_ROLES.map((r) => `<option value="${escapeHtml(r.key)}"${r.key === selected ? " selected" : ""}>${escapeHtml(r.label)}</option>`).join("");
}
function memberCard(member, csrf, self, lastAdmin) {
    const role = normalizeRole(member.staffRole);
    const caps = capabilitiesOf(role)
        .map((c) => CAPABILITY_LABELS[c] ?? c)
        .join(", ");
    const state = member.active
        ? member.hasTotp
            ? `<span class="ok">Activa</span>`
            : `<span class="muted">Activa · falta registrar el segundo factor en su primer ingreso</span>`
        : `<span class="error">Suspendida</span>`;
    const locked = self || lastAdmin;
    const note = self
        ? `<p class="muted">Es tu propia cuenta: otro administrador debe cambiarte el rol.</p>`
        : lastAdmin
            ? `<p class="muted">Es el último administrador activo: no se puede cambiar ni suspender.</p>`
            : "";
    const actions = locked
        ? ""
        : `<form method="post" action="/admin/team/${escapeHtml(member.id)}/role" autocomplete="off">${csrf}
      <label for="role-${escapeHtml(member.id)}">Rol</label>
      <select id="role-${escapeHtml(member.id)}" name="staffRole">${roleOptions(role)}</select>
      <label for="pw-role-${escapeHtml(member.id)}">Tu contraseña actual</label>
      <input id="pw-role-${escapeHtml(member.id)}" name="current" type="password" required autocomplete="current-password">
      <button type="submit">Guardar rol</button></form>
      <form method="post" action="/admin/team/${escapeHtml(member.id)}/state" autocomplete="off">${csrf}
      <input type="hidden" name="active" value="${member.active ? "0" : "1"}">
      <label for="pw-state-${escapeHtml(member.id)}">Tu contraseña actual</label>
      <input id="pw-state-${escapeHtml(member.id)}" name="current" type="password" required autocomplete="current-password">
      <button class="${member.active ? "danger" : ""}" type="submit">${member.active ? "Suspender acceso" : "Reactivar acceso"}</button></form>`;
    return `<div class="card"><h2>${escapeHtml(member.name || member.email)}</h2>
    <div>${escapeHtml(member.email)}</div>
    <div>Rol: <strong>${escapeHtml(roleLabel(role))}</strong> <span class="muted">(${escapeHtml(caps)})</span></div>
    <div>Estado: ${state}</div>${note}${actions}</div>`;
}
export function teamView(input) {
    const csrf = `<input type="hidden" name="csrf" value="${escapeHtml(input.csrf)}">`;
    const flash = input.flash
        ? `<p class="${input.flash.kind === "ok" ? "ok" : "error"}" role="status">${escapeHtml(input.flash.text)}</p>`
        : "";
    if (input.members === null) {
        return `<div class="stack"><h1>Equipo</h1>${flash}<div class="card"><p class="error">No se pudo consultar la base de datos.</p></div></div>`;
    }
    const activeAdmins = input.members.filter((m) => m.active && normalizeRole(m.staffRole) === "admin");
    const cards = input.members
        .map((m) => memberCard(m, csrf, m.id === input.selfId, activeAdmins.length <= 1 && activeAdmins.some((a) => a.id === m.id)))
        .join("");
    const roles = STAFF_ROLES.map((r) => `<li><strong>${escapeHtml(r.label)}:</strong> ${escapeHtml(r.description)}</li>`).join("");
    return `<div class="stack"><h1>Equipo</h1>${flash}
  <div class="card"><h2>Agregar una persona</h2>
    <form method="post" action="/admin/team" autocomplete="off">${csrf}
    <label for="new-name">Nombre</label><input id="new-name" name="name" required maxlength="60">
    <label for="new-email">Correo</label><input id="new-email" name="email" type="email" required maxlength="191">
    <label for="new-role">Rol</label><select id="new-role" name="staffRole">${roleOptions("operador")}</select>
    <label for="new-password">Contraseña temporal (12 caracteres o más)</label>
    <input id="new-password" name="password" type="password" required autocomplete="new-password">
    <label for="new-confirm">Repite la contraseña temporal</label>
    <input id="new-confirm" name="confirm" type="password" required autocomplete="new-password">
    <label for="new-current">Tu contraseña actual</label>
    <input id="new-current" name="current" type="password" required autocomplete="current-password">
    <button class="full" type="submit">Crear cuenta</button></form></div>
  ${cards}
  <div class="card"><h2>Qué puede hacer cada rol</h2><ul>${roles}</ul></div></div>`;
}
/** Registro del segundo factor en el primer ingreso de un miembro nuevo. */
export function enrollView(input) {
    return `<form class="login" method="post" action="/admin/login/enroll" autocomplete="off">
  <h1 class="brand">Auto<span>Mant</span>Pro</h1>
  <p class="muted">Primer ingreso: registra tu segundo factor.</p>
  ${input.error ? `<p class="error">${escapeHtml(input.error)}</p>` : ""}
  <p>Escanea este código con Google Authenticator, Microsoft Authenticator o Authy.</p>
  <div class="qr">${input.qrSvg}</div>
  <p class="muted">Si no puedes escanear, escribe esta clave en la aplicación: <code>${escapeHtml(input.secret)}</code></p>
  <label for="code">Código de 6 dígitos</label>
  <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" required>
  <button class="full" type="submit">Activar y entrar</button></form>`;
}
//# sourceMappingURL=views-team.js.map