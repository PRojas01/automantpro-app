import { escapeHtml } from "../entry/page.js";
import { formatWhatsappNumber } from "../../application/settings/whatsapp-number.js";
import { serviceTaxonomy, vehicleClasses } from "../../domain/maintenance/index.js";
import { userDataRequestsCard } from "./views-data.js";
import { userPlanCard } from "./views-plans.js";
import { RELATION_KIND_LABELS, RELATION_STATUS_LABELS, SANCTION_LEVELS, isActive as sanctionIsActive, relationCode, sanctionLabel, } from "../../application/relations/workflow.js";
import { bitacoraSection, userAppointmentsSection } from "./views-appointments.js";
import { historySection, userWorkOrdersSection } from "./views-work-orders.js";
import { userQuotesSection } from "./views-quotes.js";
// Vistas de usuarios, alta por perfil, ficha y verificaciones (fase 1, docs/33 §2.3 y docs/34 G2/G4).
export const ROLE_LABELS = {
    dueno: "Dueño de vehículo",
    taller: "Taller",
    almacen: "Almacén",
    admin: "Administrador",
};
const STATUS_LABELS = { pending: "En verificación", verified: "Verificado", rejected: "Rechazado" };
const USAGE_OPTIONS = [
    ["urbano", "Urbano"],
    ["carretera", "Carretera"],
    ["severo", "Severo (Sierra, carga, lastre)"],
];
const e = (value) => escapeHtml(value === null || value === undefined ? "" : String(value));
const csrfField = (token) => `<input type="hidden" name="csrf" value="${e(token)}">`;
const flashHtml = (flash) => flash ? `<p class="${flash.kind === "ok" ? "ok" : "error"}" role="status">${e(flash.text)}</p>` : "";
function day(value) {
    const date = value instanceof Date ? value : value ? new Date(String(value)) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "—";
}
function phoneLabel(value) {
    const text = String(value ?? "");
    const digits = text.replace(/\D/g, "");
    return text.startsWith("+") && digits.length >= 8 ? formatWhatsappNumber(digits) : text;
}
const className = (id) => vehicleClasses.classes.find((c) => c.id === id)?.name ?? String(id ?? "—");
const fuelName = (id) => vehicleClasses.fuels.find((f) => f.id === id)?.name ?? String(id ?? "—");
const categoryName = (id) => serviceTaxonomy.categories.find((c) => c.id === id)?.name ?? id;
function value(values, key) {
    const v = values[key];
    return Array.isArray(v) ? "" : e(v);
}
function field(values, name, label, attrs = "") {
    return `<label for="f-${name}">${e(label)}</label><input id="f-${name}" name="${name}" value="${value(values, name)}" ${attrs}>`;
}
function select(values, name, label, options, placeholder) {
    const selected = String(values[name] ?? "");
    const opts = options
        .map(([id, text]) => `<option value="${e(id)}"${id === selected ? " selected" : ""}>${e(text)}</option>`)
        .join("");
    const empty = placeholder ? `<option value="">${e(placeholder)}</option>` : "";
    return `<label for="f-${name}">${e(label)}</label><select id="f-${name}" name="${name}">${empty}${opts}</select>`;
}
function checkbox(values, name, label) {
    return `<div class="checks"><label><input type="checkbox" name="${name}"${values[name] === "on" ? " checked" : ""}> ${e(label)}</label></div>`;
}
function vehicleFields(values) {
    return `${select(values, "vehicleClass", "Clase de vehículo", vehicleClasses.classes.map((c) => [c.id, c.name]), "Elige…")}
    ${select(values, "fuel", "Combustible", vehicleClasses.fuels.map((f) => [f.id, f.name]), "Elige…")}
    ${field(values, "make", "Marca", 'required maxlength="60" placeholder="Toyota"')}
    ${field(values, "model", "Modelo", 'required maxlength="60" placeholder="Corolla"')}
    ${field(values, "year", "Año", 'required inputmode="numeric" maxlength="4" placeholder="2020"')}
    ${field(values, "currentKm", "Kilometraje actual", 'required inputmode="numeric" placeholder="45000"')}
    ${field(values, "plate", "Placa (opcional)", 'maxlength="9" placeholder="ABC-1234"')}
    ${select(values, "usageProfile", "Uso", USAGE_OPTIONS)}
    ${checkbox(values, "reminders", "Acepta recordatorios por WhatsApp")}`;
}
export function usersListView(input) {
    const rowsHtml = input.page.items.length === 0
        ? `<tr><td colspan="5" class="muted">Sin registros</td></tr>`
        : input.page.items
            .map((u) => `<tr><td><a href="/admin/users/${e(u.id)}">${e(u.name)}</a></td><td>${e(ROLE_LABELS[String(u.role)] ?? u.role)}</td>
            <td>${e(phoneLabel(u.phone))}</td><td>${e(u.city ?? "—")}</td><td>${day(u.createdAt)}</td></tr>`)
            .join("");
    const q = encodeURIComponent(input.query);
    const prev = input.page.page > 1 ? `<a href="/admin/users?q=${q}&amp;page=${input.page.page - 1}">← Anterior</a>` : "";
    const next = input.page.items.length === input.page.pageSize ? `<a href="/admin/users?q=${q}&amp;page=${input.page.page + 1}">Siguiente →</a>` : "";
    return `<div class="row between"><h1>Usuarios</h1><a class="button" href="/admin/users/new">+ Nuevo registro</a></div>
  <form method="get" action="/admin/users" class="row"><input name="q" value="${e(input.query)}" placeholder="Buscar por nombre o teléfono" maxlength="60"><button type="submit">Buscar</button></form>
  <div class="scroll"><table><thead><tr><th>Nombre</th><th>Perfil</th><th>Teléfono</th><th>Ciudad</th><th>Alta</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
  <div class="pager">${prev}${next}</div>`;
}
export function newUserView(input) {
    const v = input.values;
    const tabs = ["dueno", "taller", "almacen"]
        .map((p) => `<a href="/admin/users/new?perfil=${p}"${p === input.perfil ? ' class="active"' : ""}>${e(ROLE_LABELS[p])}</a>`)
        .join("");
    const common = `<div class="card"><h2>Datos básicos</h2>
    ${input_phone(v)}
    ${field(v, "name", input.perfil === "dueno" ? "Nombre y apellido" : "Nombre del responsable", 'required minlength="3" maxlength="60"')}
    ${field(v, "city", "Ciudad", 'required maxlength="120" placeholder="Quito"')}
    ${field(v, "email", "Correo (opcional)", 'type="email" maxlength="191"')}
    ${field(v, "source", "Cómo nos conoció (opcional)", 'maxlength="40" placeholder="Redes, taller, recomendación…"')}
    <label for="f-notes">Notas internas (opcional)</label><textarea id="f-notes" name="notes" maxlength="1000" rows="3">${value(v, "notes")}</textarea>
    ${checkbox(v, "consent", "Aceptó el tratamiento de datos (LOPDP) y los términos por WhatsApp")}
  </div>`;
    let specific;
    if (input.perfil === "dueno") {
        specific = `<div class="card"><h2>Primer vehículo</h2>${vehicleFields(v)}</div>`;
    }
    else {
        const business = `${field(v, "businessName", "Nombre comercial", 'required maxlength="120"')}
      ${field(v, "ruc", "RUC", 'required inputmode="numeric" maxlength="13" placeholder="1790000000001"')}
      ${field(v, "address", "Dirección", 'required maxlength="200"')}
      ${field(v, "zone", "Zona o barrio (opcional)", 'maxlength="120"')}
      ${field(v, "hours", "Horario (opcional)", 'maxlength="120" placeholder="Lun–Vie 08:00–18:00"')}`;
        if (input.perfil === "taller") {
            const chosen = Array.isArray(v.services) ? v.services.map(String) : v.services ? [String(v.services)] : [];
            const services = serviceTaxonomy.categories
                .map((c) => `<label><input type="checkbox" name="services" value="${e(c.id)}"${chosen.includes(c.id) ? " checked" : ""}> ${e(c.name)}</label>`)
                .join("");
            specific = `<div class="card"><h2>Taller</h2>${business}<label>Servicios que ofrece</label><div class="checks">${services}</div>
        <p class="muted">Queda en verificación hasta que lo apruebes; mientras tanto no aparece en las búsquedas.</p></div>`;
        }
        else {
            specific = `<div class="card"><h2>Almacén</h2>${business}
        <label for="f-categories">Categorías y marcas que maneja (opcional)</label><textarea id="f-categories" name="categories" maxlength="500" rows="3">${value(v, "categories")}</textarea>
        ${checkbox(v, "delivery", "Hace entregas a domicilio")}
        <p class="muted">Queda en verificación hasta que lo apruebes.</p></div>`;
        }
    }
    const visitCode = typeof input.values?.code === "string" ? input.values.code : "";
    const codeField = visitCode ? `<input type="hidden" name="code" value="${e(visitCode)}">` : "";
    return `<div class="stack wide"><h1>Nuevo registro</h1><div class="tabs">${tabs}</div>
  ${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
  <form method="post" action="/admin/users/new" autocomplete="off">${csrfField(input.csrf)}<input type="hidden" name="perfil" value="${input.perfil}">${codeField}
  ${common}${specific}
  <button class="full" type="submit">Guardar registro</button></form></div>`;
}
function input_phone(values) {
    return field(values, "phone", "Teléfono de WhatsApp", 'required inputmode="tel" placeholder="099 123 4567"');
}
function verificationForm(kind, id, userId, csrf) {
    return `<form method="post" action="/admin/verifications/${kind}/${e(id)}">${csrfField(csrf)}
    <input type="hidden" name="returnTo" value="${e(userId)}">
    <label for="reason-${e(id)}">Observación (obligatoria para rechazar)</label><input id="reason-${e(id)}" name="reason" maxlength="500">
    <div class="row"><button type="submit" name="decision" value="verified">Aprobar</button><button class="danger" type="submit" name="decision" value="rejected">Rechazar</button></div></form>`;
}
export function userDetailView(input) {
    const { user, vehicles, shop, store } = input.detail;
    const digits = String(user.phone ?? "").replace(/\D/g, "");
    const chat = String(user.phone ?? "").startsWith("+") && digits.length >= 8 ? ` · <a href="https://wa.me/${e(digits)}" target="_blank" rel="noopener">Abrir chat</a>` : "";
    const datos = `<div class="card"><h2>Datos</h2>
    <div>Perfil: <strong>${e(ROLE_LABELS[String(user.role)] ?? user.role)}</strong></div>
    <div>Teléfono: <strong>${e(phoneLabel(user.phone))}</strong>${chat}</div>
    <div>Correo: ${e(user.email ?? "—")}</div>
    <div>Ciudad: ${e(user.city ?? "—")}</div>
    <div>Consentimiento: ${user.consentAt ? `${day(user.consentAt)} (versión ${e(user.consentVersion ?? "—")})` : '<span class="error">sin registrar</span>'}</div>
    <div>Cómo nos conoció: ${e(user.source ?? "—")}</div>
    ${user.notes ? `<div>Notas: ${e(user.notes)}</div>` : ""}
    <div class="muted">Alta: ${day(user.createdAt)}</div></div>`;
    const business = (title, b, extra, kind) => `<div class="card"><h2>${title}</h2>
    <div><strong>${e(b.name)}</strong> · RUC ${e(b.ruc ?? "—")}</div>
    <div>${e(b.address)}, ${e(b.city)}${b.zone ? ` (${e(b.zone)})` : ""}</div>
    <div>Horario: ${e(b.hours ?? "—")}</div>${extra}
    <div>Estado: <strong>${e(STATUS_LABELS[String(b.verificationStatus)] ?? b.verificationStatus)}</strong></div>
    ${verificationForm(kind, b.id, user.id, input.csrf)}</div>`;
    const shopCard = shop
        ? business("Taller", shop, `<div>Servicios: ${e(shop.services.map(categoryName).join(", ") || "—")}</div>`, "shop")
        : "";
    const storeCard = store
        ? business("Almacén", store, `<div>Categorías: ${e(store.categories ?? "—")}</div><div>Entregas a domicilio: ${store.delivery ? "sí" : "no"}</div>`, "store")
        : "";
    const vehicleCards = vehicles
        .map((v) => {
        const plan = input.plans[String(v.id)];
        return `<div class="card"><h2>${e(v.make)} ${e(v.model)} ${e(v.year)}</h2>
      <div>${e(Number(v.currentKm).toLocaleString("es-EC"))} km · ${e(className(v.vehicleClass))} · ${e(fuelName(v.fuel))}${v.plate ? ` · ${e(v.plate)}` : ""}</div>
      <div class="muted">Uso ${e(v.usageProfile ?? "urbano")} · Recordatorios: ${v.remindersOptIn ? "sí" : "no"}</div>
      ${plan
            ? `<label for="plan-${e(v.id)}">Plan listo para copiar y pegar en WhatsApp</label><textarea id="plan-${e(v.id)}" readonly rows="12">${e(plan)}</textarea>`
            : `<p class="muted">Sin plan: faltan la clase o el combustible, o no hay reglas para esa combinación.</p>`}${String(user.role) === "dueno" ? `<p><a class="button" href="/admin/users/${e(user.id)}/schedule?vehicleId=${e(v.id)}">Agendar turno</a> · <a href="/admin/work-orders/new?ownerId=${e(user.id)}&amp;vehicleId=${e(v.id)}">Orden de trabajo sin cita</a> · <a href="/admin/quotes/new?ownerId=${e(user.id)}&amp;vehicleId=${e(v.id)}">Cotizar repuesto</a> · <a href="/admin/service-requests/new?ownerId=${e(user.id)}">Buscar especialista</a></p>` : ""}</div>`;
    })
        .join("");
    const addVehicle = String(user.role) === "dueno"
        ? `<div class="card"><h2>Agregar vehículo</h2>${input.error ? `<p class="error" role="alert">${e(input.error)}</p>` : ""}
      <form method="post" action="/admin/users/${e(user.id)}/vehicles" autocomplete="off">${csrfField(input.csrf)}${vehicleFields(input.values ?? {})}
      <button class="full" type="submit">Agregar vehículo</button></form></div>`
        : "";
    const moderation = moderationSection(String(user.id), input.relations ?? [], input.sanctions ?? [], input.csrf, !!input.canSanction);
    const lopdp = input.canLopdp ? userDataRequestsCard(String(user.id), input.dataRequests ?? [], input.csrf) : "";
    const planCard = userPlanCard(String(user.id), input.subscriptions ?? [], input.csrf, !!input.canPayments, String(user.role ?? "dueno"), input.usage ?? {});
    return `<div class="stack wide"><p><a href="/admin/users">← Usuarios</a></p><h1>${e(user.name)}</h1>${flashHtml(input.flash)}
  ${datos}${planCard}${shopCard}${storeCard}${moderation}${lopdp}${vehicleCards}${userAppointmentsSection(input.appointments ?? [])}${userWorkOrdersSection(input.workOrders ?? [])}${historySection(input.history ?? [])}${userQuotesSection(input.quotes ?? null)}${bitacoraSection(String(user.id), input.events ?? [], input.csrf)}${addVehicle}</div>`;
}
/** Vínculos y sanciones de esta entidad (docs/35 M1 y M5). */
function moderationSection(userId, relations, sanctions, csrf, canSanction) {
    if (relations.length === 0 && sanctions.length === 0 && !canSanction)
        return "";
    const links = relations.length
        ? `<ul>${relations
            .map((r) => `<li><a href="/admin/relations/${e(r.id)}">${e(relationCode(r.number))}</a> · ${e(RELATION_KIND_LABELS[r.kind] ?? r.kind)} · ${e(RELATION_STATUS_LABELS[r.status] ?? r.status)}${r.subject ? ` · ${e(r.subject)}` : ""}</li>`)
            .join("")}</ul>`
        : `<p class="muted">Sin vínculos registrados.</p>`;
    const active = sanctions.filter((s) => sanctionIsActive(s));
    const history = sanctions.length
        ? `<ul>${sanctions
            .map((s) => `<li>${e(sanctionLabel(s.level))} · ${day(s.startsAt)}${s.endsAt ? ` → ${day(s.endsAt)}` : ""}${s.liftedAt ? " (levantada)" : sanctionIsActive(s) ? ' <span class="error">vigente</span>' : " (vencida)"} · ${e(s.reason.slice(0, 160))}</li>`)
            .join("")}</ul>`
        : `<p class="muted">Sin sanciones.</p>`;
    const form = canSanction
        ? `<form method="post" action="/admin/users/${e(userId)}/sanctions">${csrfField(csrf)}
      <label for="sanction-level">Aplicar un paso de la escala</label>
      <select id="sanction-level" name="level">${SANCTION_LEVELS.map((l) => `<option value="${e(l.key)}">${e(l.label)} — ${e(l.description)}</option>`).join("")}</select>
      <label for="sanction-days">Días (vacío = el valor por defecto del paso)</label><input id="sanction-days" name="days" inputmode="numeric">
      <label for="sanction-reason">Motivo (se le comunica)</label><input id="sanction-reason" name="reason" maxlength="500" required>
      <button class="danger" type="submit">Aplicar sanción</button></form>`
        : "";
    return `<div class="card"><h2>Moderación</h2>
    ${active.length ? `<p class="error">Sanción vigente: ${e(active.map((s) => sanctionLabel(s.level)).join(", "))}</p>` : ""}
    <h2>Vínculos</h2>${links}
    <h2>Sanciones</h2>${history}${form}</div>`;
}
export function verificationsView(input) {
    const body = input.items.length === 0
        ? `<tr><td colspan="5" class="muted">No hay verificaciones pendientes</td></tr>`
        : input.items
            .map((item) => `<tr><td>${item.kind === "shop" ? "Taller" : "Almacén"}</td><td><a href="/admin/users/${e(item.userId)}">${e(item.name)}</a></td>
            <td>${e(item.city)}</td><td>${e(item.ruc ?? "—")}</td><td>${day(item.createdAt)}</td></tr>`)
            .join("");
    return `<h1>Verificaciones pendientes</h1>${flashHtml(input.flash)}
  <p class="muted">Revisa RUC, dirección y servicios antes de aprobar. Aprobar hace que aparezca en las búsquedas.</p>
  <div class="scroll"><table><thead><tr><th>Tipo</th><th>Nombre</th><th>Ciudad</th><th>RUC</th><th>Desde</th></tr></thead><tbody>${body}</tbody></table></div>`;
}
//# sourceMappingURL=views-registrations.js.map