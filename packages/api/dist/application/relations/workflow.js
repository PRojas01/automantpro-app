// Relaciones moderadas entre dueños, talleres y almacenes (docs/35). Decisiones aprobadas:
// conversación mediada por defecto (las partes hablan solo con AutoMantPro), teléfonos ocultos
// salvo consentimiento expreso de esa parte, y sanciones en cuatro pasos siempre con motivo.
export const RELATION_KIND_LABELS = {
    dueno_taller: "Dueño ↔ Taller",
    taller_almacen: "Taller ↔ Almacén",
    dueno_almacen: "Dueño ↔ Almacén",
    tripartita: "Dueño ↔ Taller ↔ Almacén",
};
export const RELATION_STATUS_LABELS = {
    propuesta: "Propuesta",
    activa: "Activa",
    en_disputa: "En disputa",
    cerrada: "Cerrada",
    bloqueada: "Bloqueada",
};
export const PARTY_ROLE_LABELS = {
    dueno: "Dueño",
    taller: "Taller",
    almacen: "Almacén",
};
/** Una relación nunca se borra: se cierra o se bloquea (docs/35 §5). */
export const RELATION_TRANSITIONS = {
    propuesta: ["activa", "cerrada", "bloqueada"],
    activa: ["en_disputa", "cerrada", "bloqueada"],
    en_disputa: ["activa", "cerrada", "bloqueada"],
    cerrada: ["activa"],
    bloqueada: ["activa"],
};
export const RELATION_OPEN_STATUSES = ["propuesta", "activa", "en_disputa"];
export function canTransition(from, to) {
    return (RELATION_TRANSITIONS[from] ?? []).includes(to);
}
export const relationCode = (number) => `VN-${String(number).padStart(5, "0")}`;
export const disputeCode = (number) => `DS-${String(number).padStart(4, "0")}`;
// --- Escala de sanciones (docs/35 M5) -----------------------------------------------------
export const SANCTION_LEVELS = [
    { key: "advertencia", label: "Advertencia", step: 1, defaultDays: null, blocksSearch: false, blocksService: false, description: "Queda el aviso y el motivo; no limita nada todavía." },
    { key: "suspension_busquedas", label: "Suspensión de búsquedas", step: 2, defaultDays: 15, blocksSearch: true, blocksService: false, description: "Deja de aparecer en las búsquedas de talleres o almacenes." },
    { key: "suspension", label: "Suspensión", step: 3, defaultDays: 30, blocksSearch: true, blocksService: true, description: "No aparece en búsquedas ni recibe turnos, órdenes ni cotizaciones nuevas." },
    { key: "baja", label: "Baja", step: 4, defaultDays: null, blocksSearch: true, blocksService: true, description: "Sale de la red. Se conserva el historial." },
];
export function sanctionLevel(level) {
    return SANCTION_LEVELS.find((l) => l.key === level) ?? null;
}
export function sanctionLabel(level) {
    return sanctionLevel(level)?.label ?? level;
}
const time = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());
/** Una sanción está vigente si no se levantó y no venció. */
export function isActive(sanction, now = new Date()) {
    if (sanction.liftedAt)
        return false;
    if (sanction.endsAt && time(sanction.endsAt) <= now.getTime())
        return false;
    return time(sanction.startsAt) <= now.getTime();
}
/** El paso siguiente de la escala según lo que ya tuvo esa persona (nunca salta pasos). */
export function nextSanctionLevel(history) {
    const top = history.reduce((max, s) => Math.max(max, sanctionLevel(s.level)?.step ?? 0), 0);
    const next = SANCTION_LEVELS.find((l) => l.step === Math.min(top + 1, 4));
    return (next ?? SANCTION_LEVELS[0]).key;
}
export function sanctionEffects(sanctions, now = new Date()) {
    let blocksSearch = false;
    let blocksService = false;
    for (const s of sanctions) {
        if (!isActive(s, now))
            continue;
        const level = sanctionLevel(s.level);
        if (!level)
            continue;
        blocksSearch = blocksSearch || level.blocksSearch;
        blocksService = blocksService || level.blocksService;
    }
    return { blocksSearch, blocksService };
}
/** Fecha de fin según los días indicados; null cuando la sanción no vence. */
export function sanctionEnd(level, days, from = new Date()) {
    const config = sanctionLevel(level);
    const effective = days ?? config?.defaultDays ?? null;
    if (effective === null || effective <= 0)
        return null;
    return new Date(from.getTime() + effective * 24 * 60 * 60 * 1000);
}
/**
 * Encabezado de contexto del mensaje reenviado (docs/35 §2.A): quién escribe y sobre qué, sin
 * incluir el teléfono de nadie.
 */
export function relayHeader(input) {
    const icon = input.fromRole === "taller" ? "🔧" : input.fromRole === "almacen" ? "📦" : "🚗";
    const subject = input.subject ? ` (${input.subject})` : "";
    return `${icon} ${input.fromName} · ${input.code}${subject}`;
}
/** Mensaje completo que el operador envía por WhatsApp a la otra parte. */
export function relayMessage(input) {
    return `${relayHeader(input)}\n"${input.body.trim()}"\n\nResponde aquí y se lo hago llegar.`;
}
/** El teléfono de una parte solo se muestra si esa parte dio su consentimiento. */
export function visibleContact(party) {
    return party.consentShareContact ? party.phone : null;
}
/** Un grupo de WhatsApp necesita el consentimiento de todas las partes (docs/35 §2.C). */
export function groupAllowed(parties) {
    return parties.length >= 2 && parties.every((p) => p.consentShareContact);
}
/** Horas que la relación lleva esperando respuesta de la otra parte. */
export function waitingHours(waitingSince, now = new Date()) {
    if (!waitingSince)
        return null;
    return Math.max(0, Math.floor((now.getTime() - time(waitingSince)) / (60 * 60 * 1000)));
}
/** La otra parte a la que hay que reenviar lo que escribió `fromUserId`. */
export function counterpart(parties, fromUserId) {
    return parties.find((p) => p.userId !== fromUserId) ?? null;
}
//# sourceMappingURL=workflow.js.map