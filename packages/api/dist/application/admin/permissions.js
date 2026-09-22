// Roles y permisos del equipo del panel (docs/39 §2). Un único lugar decide qué puede hacer
// cada rol: el panel revisa este módulo en un gancho central, así ninguna ruta nueva queda
// sin protección por olvido.
export const STAFF_ROLES = [
    { key: "admin", label: "Administrador", description: "Acceso total, incluidos ajustes y equipo." },
    { key: "operador", label: "Operador", description: "Atiende por WhatsApp, registra, agenda, abre órdenes, cotiza y media las relaciones." },
    { key: "verificador", label: "Verificador", description: "Revisa y aprueba talleres y almacenes, resuelve disputas y deja notas." },
    { key: "soporte", label: "Soporte", description: "Atiende conversaciones, media relaciones y deja notas; no registra ni agenda." },
    { key: "lectura", label: "Solo lectura", description: "Solo consulta; no puede cambiar nada." },
];
const ROLE_CAPABILITIES = {
    admin: ["read", "attend", "registrations", "verifications", "appointments", "workorders", "quotes", "notes", "relations", "disputes", "sanctions", "exports", "lopdp", "payments", "plans", "settings", "team"],
    operador: ["read", "attend", "registrations", "appointments", "workorders", "quotes", "notes", "relations", "payments"],
    verificador: ["read", "verifications", "notes", "disputes"],
    soporte: ["read", "attend", "notes", "relations"],
    lectura: ["read"],
};
const KNOWN = new Set(STAFF_ROLES.map((r) => r.key));
/**
 * Normaliza lo guardado en la base. Sin valor (cuentas creadas antes de los roles) es
 * administrador; un valor desconocido cae al rol más restringido.
 */
export function normalizeRole(value) {
    if (value === null || value === undefined || value === "")
        return "admin";
    const clean = String(value).trim().toLowerCase();
    return KNOWN.has(clean) ? clean : "lectura";
}
export function roleLabel(role) {
    return STAFF_ROLES.find((r) => r.key === role)?.label ?? role;
}
export function capabilitiesOf(role) {
    return ROLE_CAPABILITIES[role] ?? ROLE_CAPABILITIES.lectura;
}
export function can(role, capability) {
    return capabilitiesOf(normalizeRole(role)).includes(capability);
}
/** Rutas que no dependen del rol: ingreso, salida, puesta en marcha y la cuenta propia. */
const EXEMPT = [/^\/login(\/|$)/, /^\/logout$/, /^\/setup(\/|$)/, /^\/account(\/|$)/];
const RULES = [
    { method: "POST", pattern: /^\/attend(\/|$)/, capability: "attend" },
    { method: "POST", pattern: /^\/users\/new(\/|$)/, capability: "registrations" },
    { method: "GET", pattern: /^\/users\/new$/, capability: "registrations" },
    { method: "POST", pattern: /^\/users\/[^/]+\/vehicles$/, capability: "registrations" },
    { method: "POST", pattern: /^\/users\/[^/]+\/notes$/, capability: "notes" },
    { method: "GET", pattern: /^\/users\/[^/]+\/schedule$/, capability: "appointments" },
    { method: "POST", pattern: /^\/verifications(\/|$)/, capability: "verifications" },
    { method: "POST", pattern: /^\/appointments(\/|$)/, capability: "appointments" },
    { method: "GET", pattern: /^\/work-orders\/new$/, capability: "workorders" },
    { method: "POST", pattern: /^\/work-orders(\/|$)/, capability: "workorders" },
    { method: "GET", pattern: /^\/service-requests\/new$/, capability: "appointments" },
    { method: "POST", pattern: /^\/service-requests(\/|$)/, capability: "appointments" },
    { method: "GET", pattern: /^\/quotes\/new$/, capability: "quotes" },
    { method: "POST", pattern: /^\/quotes(\/|$)/, capability: "quotes" },
    { method: "POST", pattern: /^\/relations\/[^/]+\/dispute$/, capability: "disputes" },
    { method: "POST", pattern: /^\/relations(\/|$)/, capability: "relations" },
    { method: "POST", pattern: /^\/disputes(\/|$)/, capability: "disputes" },
    { method: "POST", pattern: /^\/ratings(\/|$)/, capability: "disputes" },
    { method: "POST", pattern: /^\/users\/[^/]+\/sanctions$/, capability: "sanctions" },
    { method: "POST", pattern: /^\/sanctions(\/|$)/, capability: "sanctions" },
    // La lista de sanciones es información sensible de moderación: solo el administrador.
    { method: "GET", pattern: /^\/sanctions(\/|$)/, capability: "sanctions" },
    // Respaldos y solicitudes de datos: salen datos personales del sistema, solo el administrador.
    // Registrar un pago lo hace el operador; verificarlo o darlo de baja, solo el administrador.
    { method: "POST", pattern: /^\/users\/[^/]+\/subscriptions$/, capability: "payments" },
    { method: "GET", pattern: /^\/plans(\/|$)/, capability: "plans" },
    { method: "POST", pattern: /^\/subscriptions(\/|$)/, capability: "plans" },
    { method: "GET", pattern: /^\/exports(\/|$)/, capability: "exports" },
    { method: "GET", pattern: /^\/data-requests(\/|$)/, capability: "lopdp" },
    { method: "POST", pattern: /^\/data-requests(\/|$)/, capability: "lopdp" },
    { method: "GET", pattern: /^\/settings(\/|$)/, capability: "settings" },
    { method: "POST", pattern: /^\/settings(\/|$)/, capability: "settings" },
    { method: "GET", pattern: /^\/team(\/|$)/, capability: "team" },
    { method: "POST", pattern: /^\/team(\/|$)/, capability: "team" },
];
/**
 * Permiso necesario para una petición del panel. `path` va sin el prefijo /admin y sin
 * parámetros. Devuelve null cuando la ruta no depende del rol.
 */
export function requiredCapability(method, path) {
    const clean = (path.split("?")[0] || "/").replace(/\/+$/, "") || "/";
    if (EXEMPT.some((r) => r.test(clean)))
        return null;
    const verb = method.toUpperCase() === "POST" ? "POST" : "GET";
    for (const rule of RULES) {
        if (rule.method === verb && rule.pattern.test(clean))
            return rule.capability;
    }
    // Todo lo demás: las páginas de consulta piden "read"; cualquier POST sin regla propia
    // exige el rol completo, para que una ruta nueva nunca quede abierta por descuido.
    return verb === "POST" ? "settings" : "read";
}
//# sourceMappingURL=permissions.js.map