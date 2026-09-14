import { findSubservice, formatDuration } from "../../domain/maintenance/index.js";
// Horarios en hora de Ecuador y textos listos para enviar por WhatsApp en la fase 1.
const TIME_ZONE = "America/Guayaquil";
/** Ecuador continental: UTC-5 todo el año (sin horario de verano). */
const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const STATUS_LABELS = {
    pending: "Solicitado",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
};
/** Cambios de estado permitidos desde cada estado. */
export const ALLOWED_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};
/** "2026-09-15" + "10:00" en hora de Ecuador → instante UTC; null si no es una fecha u hora válida. */
export function parseEcDateTime(date, time) {
    if (typeof date !== "string" || typeof time !== "string")
        return null;
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    const t = /^(\d{2}):(\d{2})$/.exec(time.trim());
    if (!d || !t)
        return null;
    const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
    const [hour, minute] = [Number(t[1]), Number(t[2])];
    if (hour > 23 || minute > 59)
        return null;
    const base = new Date(Date.UTC(year, month - 1, day));
    if (base.getUTCFullYear() !== year || base.getUTCMonth() !== month - 1 || base.getUTCDate() !== day)
        return null;
    return new Date(base.getTime() + OFFSET_MS + (hour * 60 + minute) * 60 * 1000);
}
/** Inicio y fin del día de hoy en Ecuador, como instantes UTC. */
export function ecDayRange(now = new Date()) {
    const local = new Date(now.getTime() - OFFSET_MS);
    const start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + OFFSET_MS);
    return { start, end: new Date(start.getTime() + DAY_MS) };
}
export function formatEcDateTime(value) {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime()))
        return "—";
    return new Intl.DateTimeFormat("es-EC", {
        timeZone: TIME_ZONE,
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}
export function serviceNames(ids) {
    return ids.map((id) => findSubservice(id)?.subservice.name ?? id);
}
export function categoriesFor(ids) {
    return [...new Set(ids.map((id) => findSubservice(id)?.category.id).filter((c) => !!c))];
}
const usd = (value) => `$${Math.round(value)}`;
export function selectionSummary(ids) {
    let cost = 0;
    let minutes = 0;
    const lines = ["Servicios elegidos:"];
    for (const id of ids) {
        const ref = findSubservice(id);
        if (!ref)
            continue;
        cost += ref.subservice.costRefUsd;
        minutes += ref.subservice.durationMin;
        lines.push(`• ${ref.subservice.name} (≈ ${usd(ref.subservice.costRefUsd)})`);
    }
    lines.push(`Total referencial: ≈ ${usd(cost)} · ${formatDuration(minutes)} aprox.`);
    return lines.join("\n");
}
export function shopListMessage(shops) {
    const lines = ["Estos talleres verificados cubren lo que necesitas:", ""];
    shops.slice(0, 8).forEach((shop, i) => {
        const zone = shop.zone ? ` · ${shop.zone}` : "";
        const rating = shop.ratingAvg > 0 ? ` · ⭐ ${shop.ratingAvg.toFixed(1)}` : "";
        const coverage = shop.covered === shop.needed ? "cubre todo" : `cubre ${shop.covered} de ${shop.needed}`;
        lines.push(`${i + 1}) ${shop.name}${zone}${rating} · ${coverage}`);
    });
    lines.push("", "Responde con el número del taller y el día y la hora que prefieres.");
    return lines.join("\n");
}
function servicesText(a) {
    const names = serviceNames(a.services);
    return names.length > 0 ? names.join(", ") : (a.summary ?? "—");
}
const vehicleText = (a) => `${a.vehicleLabel}${a.plate ? ` · ${a.plate}` : ""}`;
/** Mensaje para el dueño según el estado del turno. */
export function ownerMessage(a) {
    const when = formatEcDateTime(a.scheduledAt);
    switch (a.status) {
        case "confirmed":
            return `✅ Tu turno está confirmado\n🔧 ${a.shopName}\n📍 ${a.shopAddress}, ${a.shopCity}\n🗓️ ${when}\n🚗 ${vehicleText(a)}\n🛠️ ${servicesText(a)}\n\nTe lo recuerdo un día antes. Si necesitas cambiarlo, escríbeme.`;
        case "completed":
            return `🏁 Tu servicio en ${a.shopName} quedó registrado como completado.\n🚗 ${vehicleText(a)}\n\n¿Cómo te fue? Califica del 1 al 5 y cuéntame si todo quedó bien.`;
        case "cancelled":
            return `❌ Tu turno en ${a.shopName} del ${when} fue cancelado${a.cancelReason ? `: ${a.cancelReason}` : ""}.\n\n¿Quieres que te busque otro horario u otro taller?`;
        default:
            return `📅 Solicitud de turno enviada\n🔧 ${a.shopName}\n📍 ${a.shopAddress}, ${a.shopCity}\n🗓️ ${when}\n🚗 ${vehicleText(a)}\n🛠️ ${servicesText(a)}\n\nTe confirmo apenas el taller responda.`;
    }
}
/** Mensaje para el taller con la solicitud. */
export function shopRequestMessage(a) {
    return `🔔 Nueva solicitud de turno — AutoMantPro\n🗓️ ${formatEcDateTime(a.scheduledAt)}\n🚗 ${vehicleText(a)}\n🛠️ ${servicesText(a)}${a.notes ? `\n📝 ${a.notes}` : ""}\n\nResponde: 1) Aceptar · 2) Proponer otro horario · 3) Rechazar`;
}
//# sourceMappingURL=messages.js.map