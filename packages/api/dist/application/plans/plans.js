// Planes y suscripciones (docs/42). En la fase 1 el cobro es manual: el cliente transfiere, el
// operador registra el pago y un administrador lo verifica. Nada queda activo sin esa verificación.
export const PLAN_LABELS = {
    gratis: "Gratis",
    prueba: "Prueba",
    premium: "Premium",
};
export const STATUS_LABELS = {
    pendiente: "Pendiente de verificar",
    activa: "Activa",
    rechazada: "Rechazada",
    vencida: "Vencida",
    cancelada: "Cancelada",
};
export const PAYMENT_METHODS = [
    ["transferencia", "Transferencia bancaria"],
    ["deposito", "Depósito"],
    ["efectivo", "Efectivo"],
    ["cortesia", "Cortesía (sin cobro)"],
    ["otro", "Otro"],
];
const PLAN_FEATURES = {
    gratis: ["plan_mantenimiento", "talleres_cercanos"],
    prueba: ["plan_mantenimiento", "talleres_cercanos", "talleres_verificados", "cotizaciones", "garantia", "historial_export"],
    premium: ["plan_mantenimiento", "talleres_cercanos", "talleres_verificados", "cotizaciones", "garantia", "historial_export"],
};
export const FEATURE_LABELS = {
    plan_mantenimiento: "Plan de mantenimiento y recordatorios",
    talleres_cercanos: "Talleres cercanos (enlace de mapa)",
    talleres_verificados: "Talleres verificados y cita coordinada",
    cotizaciones: "Cotizaciones a varios almacenes",
    garantia: "Garantía respaldada y mediación",
    historial_export: "Historial completo exportable",
};
export function allows(plan, feature) {
    return (PLAN_FEATURES[plan] ?? PLAN_FEATURES.gratis).includes(feature);
}
export const FREE_LIMITS = {
    dueno: { vehicles: 2, appointmentsPerMonth: 2, quotesPerMonth: 2 },
    taller: { workOrdersPerMonth: 10, quotesPerMonth: 5 },
    almacen: { quotesPerMonth: 15 },
};
export const LIMIT_LABELS = {
    vehicles: "vehículos registrados",
    appointmentsPerMonth: "turnos al mes",
    workOrdersPerMonth: "órdenes al mes",
    quotesPerMonth: "cotizaciones al mes",
};
/** Estado de los límites del plan gratuito para un perfil; vacío si el plan es pagado. */
export function limitsFor(plan, role, usage) {
    if (plan !== "gratis")
        return [];
    const limits = FREE_LIMITS[role] ?? {};
    const states = [];
    for (const [key, limit] of Object.entries(limits)) {
        const used = usage[key] ?? 0;
        states.push({ key, label: LIMIT_LABELS[key], used, limit, reached: used >= limit });
    }
    return states;
}
/** Mensaje corto para ofrecer el plan pagado cuando alguien llegó a un tope. */
export function upgradeMessage(role, limit) {
    const queDa = role === "taller"
        ? "aparecer como taller verificado, recibir más clientes y llevar todas tus órdenes"
        : role === "almacen"
            ? "responder todas las cotizaciones que quieras y aparecer primero en las búsquedas"
            : "talleres verificados con precio acordado, cotizaciones a varios almacenes y garantía respaldada";
    return `Llegaste al límite del plan gratuito (${limit.limit} ${limit.label}). Con Premium tienes ${queDa}. ¿Te cuento cómo?`;
}
const time = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());
/** Una suscripción cuenta si está verificada, ya empezó y todavía no vence. */
export function isRunning(sub, now = new Date()) {
    if (sub.status !== "activa")
        return false;
    if (time(sub.startsAt) > now.getTime())
        return false;
    return sub.endsAt === null || time(sub.endsAt) > now.getTime();
}
/** Plan vigente de una persona: premium gana sobre prueba, y prueba sobre gratis. */
export function effectivePlan(subs, now = new Date()) {
    let plan = "gratis";
    for (const sub of subs) {
        if (!isRunning(sub, now))
            continue;
        if (sub.plan === "premium")
            return "premium";
        if (sub.plan === "prueba")
            plan = "prueba";
    }
    return plan;
}
/** Suscripción vigente que manda, para mostrar su vencimiento. */
export function currentSubscription(subs, now = new Date()) {
    const running = subs.filter((s) => isRunning(s, now));
    const premium = running.find((s) => s.plan === "premium");
    return premium ?? running.find((s) => s.plan === "prueba") ?? null;
}
export function daysLeft(endsAt, now = new Date()) {
    if (!endsAt)
        return null;
    return Math.ceil((time(endsAt) - now.getTime()) / (24 * 60 * 60 * 1000));
}
/** Fin del período según los meses pagados; null cuando no vence. */
export function periodEnd(months, from = new Date()) {
    if (!Number.isFinite(months) || months <= 0)
        return null;
    const end = new Date(from.getTime());
    end.setMonth(end.getMonth() + Math.floor(months));
    return end;
}
/** Monto con hasta dos decimales; null si no es un número válido de dinero. */
export function parseAmount(input) {
    if (typeof input !== "string")
        return null;
    const value = input.trim().replace(/[\s$]/g, "").replace(",", ".");
    if (!value)
        return null;
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(value))
        return null;
    return Number(value);
}
export const subscriptionCode = (number) => `SB-${String(number).padStart(4, "0")}`;
/**
 * Talleres cercanos para quien no tiene plan pagado: se entrega un enlace de búsqueda de Google
 * Maps, no una lista copiada. Así se cumple con los términos del mapa y no cuesta por consulta.
 */
export function nearbyWorkshopsLink(city, reference = "") {
    const query = ["talleres mecánicos", reference.trim(), city.trim()].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}
export function nearbyWorkshopsMessage(city, reference = "") {
    const link = nearbyWorkshopsLink(city, reference);
    return [
        "🗺️ Estos son los talleres que aparecen cerca de ti en el mapa:",
        link,
        "",
        "Ojo: esos no los hemos verificado nosotros.",
        "Con el plan Premium te consigo talleres verificados, con precio acordado antes de entrar y garantía respaldada. ¿Te cuento cómo?",
    ].join("\n");
}
//# sourceMappingURL=plans.js.map