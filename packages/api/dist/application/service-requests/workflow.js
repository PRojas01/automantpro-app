import { serviceTaxonomy } from "../../domain/maintenance/index.js";
export const REQUEST_STATUS_LABELS = {
    abierta: "Abierta",
    cerrada: "Cerrada",
    cancelada: "Cancelada",
};
export const OFFER_STATUS_LABELS = {
    invitado: "Invitado",
    ofertado: "Respondió",
    sin_disponibilidad: "Sin disponibilidad",
    elegido: "Elegido",
    descartado: "No elegido",
};
/** Máximo de talleres invitados por solicitud: suficiente para comparar, sin spam. */
export const MAX_SHOPS_PER_REQUEST = 5;
export const serviceRequestCode = (number) => `SS-${String(number).padStart(4, "0")}`;
export const CATEGORIES = serviceTaxonomy.categories.map((c) => ({ id: c.id, name: c.name }));
export function categoryName(id) {
    return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}
const normalize = (value) => value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
/**
 * Ordena los talleres para una solicitud: primero los que atienden esa especialidad, luego los de
 * la misma zona y, entre iguales, los mejor calificados.
 */
export function rankShopsFor(candidates, category, zone) {
    const zona = zone ? normalize(zone) : null;
    return candidates
        .map((shop) => {
        const specialist = shop.services.includes(category);
        const sameZone = !!zona && !!shop.zone && normalize(shop.zone) === zona;
        const score = (specialist ? 100 : 0) + (sameZone ? 25 : 0) + Math.min(10, shop.ratingAvg * 2);
        return { ...shop, specialist, sameZone, score };
    })
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
/** Los que se invitan: especialistas primero; si no hay suficientes, se completa con el resto. */
export function shopsToInvite(ranked, max = MAX_SHOPS_PER_REQUEST) {
    const especialistas = ranked.filter((s) => s.specialist);
    if (especialistas.length >= max)
        return especialistas.slice(0, max);
    return [...especialistas, ...ranked.filter((s) => !s.specialist)].slice(0, max);
}
/** Mensaje que recibe cada taller invitado. Sin datos del dueño: la conversación sigue mediada. */
export function invitationMessage(request) {
    const donde = [request.zone, request.city].filter(Boolean).join(", ");
    return [
        `🔧 Solicitud ${serviceRequestCode(request.number)} · ${categoryName(request.category)}`,
        request.vehicle ? `Vehículo: ${request.vehicle}` : null,
        donde ? `Zona: ${donde}` : null,
        "",
        `"${request.description.trim()}"`,
        "",
        "¿Puedes atenderlo? Respóndeme con precio estimado, cuánto demora y cuándo tendrías espacio.",
    ]
        .filter((line) => line !== null)
        .join("\n");
}
/** Comparación que recibe el dueño con las respuestas de los talleres. */
export function comparisonMessage(request, offers) {
    if (offers.length === 0) {
        return `Todavía no tengo respuestas para tu solicitud ${serviceRequestCode(request.number)}. Apenas conteste un taller te aviso.`;
    }
    const ordenadas = [...offers].sort((a, b) => (a.priceUsd ?? Number.MAX_SAFE_INTEGER) - (b.priceUsd ?? Number.MAX_SAFE_INTEGER));
    const lineas = ordenadas.map((offer, index) => {
        const partes = [
            offer.priceUsd === null ? "precio a confirmar" : `US$ ${offer.priceUsd.toFixed(2)}`,
            offer.durationMin ? `${offer.durationMin} min` : null,
            offer.availability,
            offer.warrantyDays ? `garantía ${offer.warrantyDays} días` : null,
        ].filter(Boolean);
        return `${index + 1}) ${offer.shopName} · ${partes.join(" · ")}`;
    });
    return [
        `🔧 Respuestas para ${serviceRequestCode(request.number)} (${categoryName(request.category)}):`,
        ...lineas,
        "",
        "Responde con el número del taller que prefieras y te agendo el turno.",
    ].join("\n");
}
/** Monto con hasta dos decimales; null si no es válido. */
export function parsePrice(input) {
    if (typeof input !== "string")
        return null;
    const value = input.trim().replace(/[\s$]/g, "").replace(",", ".");
    if (!value)
        return null;
    return /^\d{1,6}(\.\d{1,2})?$/.test(value) ? Number(value) : null;
}
//# sourceMappingURL=workflow.js.map