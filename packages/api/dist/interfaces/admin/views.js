import { escapeHtml } from "../entry/page.js";
// Vistas HTML del panel /admin. Todo en línea (el servidor se empaqueta en un único archivo)
// y todo lo interpolado se escapa.
const STYLES = `
:root{--bg:#f5f8fa;--card:#fff;--text:#0f1b24;--muted:#51626f;--line:#e2e8ee;--cyan:#00a8c6;--green:#16a34a;--red:#dc2626}
@media (prefers-color-scheme:dark){:root{--bg:#071116;--card:#0d1c24;--text:#e6f1f5;--muted:#9fb3bf;--line:#1e3440;--cyan:#22d3ee;--green:#4ade80;--red:#f87171}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--card);border-bottom:1px solid var(--line);flex-wrap:wrap}
.brand{font-weight:800}.brand span{color:var(--cyan)}
nav a{color:var(--text);text-decoration:none;margin-right:14px;font-weight:600}nav a:hover{color:var(--cyan)}
main{max-width:1100px;margin:0 auto;padding:16px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.card h2{margin:0 0 8px;font-size:15px;color:var(--muted)}.big{font-size:28px;font-weight:800}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;font-size:14px}th{color:var(--muted)}
.scroll{overflow-x:auto}
form.login{max-width:360px;margin:10vh auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px}
label{display:block;margin:12px 0 4px;font-weight:600}
input{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text);font-size:16px}
button{min-height:44px;padding:8px 16px;border:0;border-radius:10px;background:var(--green);color:#fff;font-weight:700;cursor:pointer}
.full{width:100%;margin-top:18px}.error{color:var(--red);font-weight:600}.muted{color:var(--muted)}
.pager{margin:12px 0;display:flex;gap:12px}.pager a{color:var(--cyan)}
.ok{color:var(--green);font-weight:600}.stack{display:grid;gap:12px;max-width:560px;margin:0 auto}
.qr{background:#fff;padding:10px;border-radius:12px;display:inline-block;line-height:0}.qr svg{width:220px;height:220px;max-width:100%}
code{word-break:break-all;font-size:15px}a{color:var(--cyan)}
select,textarea{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text);font:inherit;font-size:16px}
textarea[readonly]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px}
.wide{max-width:900px}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.row input{flex:1;min-width:180px}.between{justify-content:space-between}
.checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px;margin:8px 0}.checks label{display:flex;gap:8px;align-items:center;font-weight:400;margin:0}
input[type=checkbox]{width:auto;min-height:0}
.tabs{display:flex;gap:8px;flex-wrap:wrap}.tabs a{padding:8px 14px;border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--text)}.tabs a.active{background:var(--cyan);border-color:var(--cyan);color:#fff}
a.button{display:inline-block;padding:10px 16px;border-radius:10px;background:var(--green);color:#fff;font-weight:700;text-decoration:none}
button.danger{background:var(--red)}
`;
export function layout(input) {
    const nonce = escapeHtml(input.nonce);
    const header = input.nav
        ? `<header><div class="brand">Auto<span>Mant</span>Pro · Admin</div>
  <nav><a href="/admin">Tablero</a><a href="/admin/users">Usuarios</a><a href="/admin/vehicles">Vehículos</a><a href="/admin/shops">Talleres</a><a href="/admin/verifications">Verificaciones</a><a href="/admin/audit">Auditoría</a><a href="/admin/settings">Ajustes</a><a href="/admin/account">Mi cuenta</a></nav>
  <form method="post" action="/admin/logout"><input type="hidden" name="csrf" value="${escapeHtml(input.csrfToken ?? "")}"><button type="submit">Salir</button></form></header>`
        : "";
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${escapeHtml(input.title)} · AutoMantPro Admin</title>
<style nonce="${nonce}">${STYLES}</style></head><body>${header}<main>${input.body}</main></body></html>`;
}
export function loginView(error) {
    return `<form class="login" method="post" action="/admin/login" autocomplete="on">
  <h1 class="brand">Auto<span>Mant</span>Pro</h1><p class="muted">Panel de administración</p>
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  <label for="email">Correo</label><input id="email" name="email" type="email" required autocomplete="username">
  <label for="password">Contraseña</label><input id="password" name="password" type="password" required autocomplete="current-password">
  <button class="full" type="submit">Continuar</button></form>`;
}
export function twoFactorView(error) {
    return `<form class="login" method="post" action="/admin/login/2fa" autocomplete="off">
  <h1 class="brand">Verificación en dos pasos</h1><p class="muted">Escribe el código de 6 dígitos de tu app de autenticación.</p>
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  <label for="code">Código</label><input id="code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code">
  <button class="full" type="submit">Entrar</button></form>`;
}
export function messageView(title, text) {
    return `<div class="card"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p></div>`;
}
function kv(record) {
    const entries = Object.entries(record);
    if (entries.length === 0)
        return `<p class="muted">Sin datos</p>`;
    return entries.map(([k, v]) => `<div>${escapeHtml(k)}: <strong>${v}</strong></div>`).join("");
}
export function dashboardView(input) {
    const roleLabels = { dueno: "Dueño", taller: "Taller", almacen: "Almacén" };
    const recentList = input.recent && input.recent.length > 0
        ? input.recent
            .map((r) => `<div><a href="/admin/users/${escapeHtml(String(r.id))}">${escapeHtml(String(r.name ?? "—"))}</a> <span class="muted">· ${escapeHtml(roleLabels[String(r.role)] ?? String(r.role ?? ""))}</span></div>`)
            .join("")
        : `<p class="muted">${input.recent ? "Aún no hay registros" : "Sin datos"}</p>`;
    const registros = `<div class="card"><h2>Verificaciones pendientes</h2><div class="big">${input.pendingVerifications ?? "—"}</div><p><a href="/admin/verifications">Revisar talleres y almacenes</a></p></div>
  <div class="card"><h2>Registros recientes</h2>${recentList}<p><a class="button" href="/admin/users/new">+ Nuevo registro</a></p></div>`;
    const salud = `<div class="card"><h2>Salud</h2>
    <div>Versión: <strong>${escapeHtml(input.version)}</strong></div>
    <div>Activo hace: <strong>${Math.floor(input.uptimeSeconds / 60)} min</strong></div>
    <div>Base de datos: <strong>${input.data ? "conectada" : "no conectada"}</strong></div>
    ${input.dbError ? `<div class="muted">${escapeHtml(input.dbError)}</div>` : ""}</div>`;
    if (!input.data) {
        return `<h1>Tablero</h1><div class="grid">${registros}${salud}</div>`;
    }
    const d = input.data;
    const totalUsers = Object.values(d.usersByRole).reduce((a, b) => a + b, 0);
    return `<h1>Tablero</h1><div class="grid">
  <div class="card"><h2>Operación</h2><div>Turnos hoy: <strong>${d.appointmentsToday}</strong></div><div>Turnos pendientes: <strong>${d.appointmentsPending}</strong></div><div>Conversaciones: <strong>${d.conversations}</strong></div><div>Mensajes 24 h: <strong>${d.messages24h}</strong></div></div>
  <div class="card"><h2>Crecimiento</h2><div class="big">${totalUsers}</div><div class="muted">usuarios</div>${kv(d.usersByRole)}<div>Vehículos: <strong>${d.vehicles}</strong></div><div>Almacenes: <strong>${d.stores}</strong></div></div>
  <div class="card"><h2>Talleres por verificación</h2>${kv(d.shopsByStatus)}</div>
  ${registros}${salud}</div>`;
}
function cell(value) {
    if (value instanceof Date)
        return escapeHtml(value.toISOString().replace("T", " ").slice(0, 16));
    if (value === null || value === undefined)
        return `<span class="muted">—</span>`;
    return escapeHtml(String(value));
}
export function tableView(title, base, page, columns) {
    const head = columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("");
    const body = page.items.length === 0
        ? `<tr><td colspan="${columns.length}" class="muted">Sin registros</td></tr>`
        : page.items.map((row) => `<tr>${columns.map(([key]) => `<td>${cell(row[key])}</td>`).join("")}</tr>`).join("");
    const prev = page.page > 1 ? `<a href="${base}?page=${page.page - 1}">← Anterior</a>` : "";
    const next = page.items.length === page.pageSize ? `<a href="${base}?page=${page.page + 1}">Siguiente →</a>` : "";
    return `<h1>${escapeHtml(title)}</h1><div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div><div class="pager">${prev}${next}</div>`;
}
//# sourceMappingURL=views.js.map