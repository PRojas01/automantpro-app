// Ajustes de operación editables desde el panel (docs/35 A2): ciudades activas, horario
// silencioso, texto de bienvenida e interruptores por función. Cambiarlos no requiere publicar.
export const PLATFORM_KEYS = {
    cities: "platform.cities",
    quietFrom: "platform.quietFrom",
    quietTo: "platform.quietTo",
    welcomeIntro: "platform.welcomeIntro",
    features: "platform.features",
    entryMode: "platform.entryMode",
};
export const FEATURES = [
    { key: "appointments", label: "Turnos con talleres", pausedText: "Los turnos están pausados desde Ajustes." },
    { key: "workorders", label: "Órdenes de trabajo", pausedText: "Las órdenes de trabajo están pausadas desde Ajustes." },
    { key: "quotes", label: "Cotizaciones con almacenes", pausedText: "Las cotizaciones están pausadas desde Ajustes." },
];
export function emptyPlatformSettings() {
    return { entryMode: "menu", cities: [], quietFrom: null, quietTo: null, welcomeIntro: null, features: { appointments: true, workorders: true, quotes: true } };
}
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function parseEntryMode(input) {
    return input === "directo" ? "directo" : "menu";
}
export function parseCities(input) {
    if (typeof input !== "string")
        return [];
    return [
        ...new Set(input
            .split(/[,\n;]/)
            .map((c) => c.trim().replace(/\s+/g, " "))
            .filter((c) => c.length >= 2 && c.length <= 60)
            .map((c) => c.slice(0, 60))),
    ].slice(0, 40);
}
export function parseTime(input) {
    return typeof input === "string" && TIME.test(input.trim()) ? input.trim() : null;
}
const normalize = (value) => value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
/** Con la lista vacía se acepta cualquier ciudad; con lista, solo las configuradas. */
export function cityAllowed(city, cities) {
    if (cities.length === 0)
        return true;
    return cities.some((c) => normalize(c) === normalize(city));
}
/** Hora local de Ecuador en formato HH:MM. */
export function localTime(now = new Date()) {
    return new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Guayaquil" }).format(now);
}
/**
 * Horario silencioso: no se envían mensajes. Admite rangos que cruzan la medianoche
 * (por ejemplo 21:00 → 07:00).
 */
export function inQuietHours(settings, now = new Date()) {
    const { quietFrom, quietTo } = settings;
    if (!quietFrom || !quietTo || quietFrom === quietTo)
        return false;
    const current = localTime(now);
    return quietFrom < quietTo ? current >= quietFrom && current < quietTo : current >= quietFrom || current < quietTo;
}
export function quietNotice(settings, now = new Date()) {
    if (!inQuietHours(settings, now))
        return null;
    return `Horario silencioso (${settings.quietFrom} a ${settings.quietTo}): evita enviar mensajes salvo que el contacto haya escrito primero.`;
}
export async function loadPlatformSettings(settings) {
    const result = emptyPlatformSettings();
    const [cities, quietFrom, quietTo, welcomeIntro, features, entryMode] = await Promise.all([
        settings.get(PLATFORM_KEYS.cities),
        settings.get(PLATFORM_KEYS.quietFrom),
        settings.get(PLATFORM_KEYS.quietTo),
        settings.get(PLATFORM_KEYS.welcomeIntro),
        settings.get(PLATFORM_KEYS.features),
        settings.get(PLATFORM_KEYS.entryMode),
    ]);
    result.entryMode = parseEntryMode(entryMode);
    result.cities = parseCities(cities ?? "");
    result.quietFrom = parseTime(quietFrom);
    result.quietTo = parseTime(quietTo);
    result.welcomeIntro = welcomeIntro?.trim() ? welcomeIntro.trim().slice(0, 300) : null;
    if (features) {
        // Guardado como lista de funciones apagadas, para que una función nueva nazca encendida.
        const off = new Set(features.split(",").map((f) => f.trim()));
        for (const feature of FEATURES)
            result.features[feature.key] = !off.has(feature.key);
    }
    return result;
}
export async function savePlatformSettings(settings, values, updatedBy) {
    await settings.set(PLATFORM_KEYS.entryMode, values.entryMode, updatedBy);
    await settings.set(PLATFORM_KEYS.cities, values.cities.join(", "), updatedBy);
    await settings.set(PLATFORM_KEYS.quietFrom, values.quietFrom ?? "", updatedBy);
    await settings.set(PLATFORM_KEYS.quietTo, values.quietTo ?? "", updatedBy);
    await settings.set(PLATFORM_KEYS.welcomeIntro, values.welcomeIntro ?? "", updatedBy);
    const off = FEATURES.filter((f) => !values.features[f.key]).map((f) => f.key);
    await settings.set(PLATFORM_KEYS.features, off.join(","), updatedBy);
}
/** Texto del interruptor apagado, para responder con un mensaje claro al operador. */
export function featurePaused(settings, key) {
    return settings.features[key] ? null : (FEATURES.find((f) => f.key === key)?.pausedText ?? "Función pausada desde Ajustes.");
}
//# sourceMappingURL=platform.js.map