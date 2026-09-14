import { findSubservice, resolveRules, isServiceApplicable, } from "./catalogs.js";
import { serviceTaxonomy } from "./catalogs.js";
const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.44;
const DEFAULT_KM_PER_DAY = {
    urbano: 25,
    carretera: 60,
    severo: 40,
};
const NEXT_WINDOW_KM = 1_000;
const NEXT_WINDOW_DAYS = 30;
const STATUS_ORDER = { vencido: 0, proximo: 1, al_dia: 2 };
export function toDate(input) {
    return input instanceof Date ? new Date(input.getTime()) : new Date(input);
}
/** Días transcurridos de `a` a `b` (positivo si b es posterior), normalizado a UTC. */
export function daysBetween(a, b) {
    const aDate = toDate(a);
    const bDate = toDate(b);
    const aUtc = Date.UTC(aDate.getFullYear(), aDate.getMonth(), aDate.getDate());
    const bUtc = Date.UTC(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
    return Math.round((bUtc - aUtc) / MS_PER_DAY);
}
export function addMonths(date, months) {
    const base = toDate(date);
    return new Date(base.getTime() + months * DAYS_PER_MONTH * MS_PER_DAY);
}
/**
 * Estima el kilometraje recorrido por día usando la lectura más reciente
 * anterior al odómetro actual. Sin lecturas, usa el promedio por perfil de uso.
 */
export function estimateKmPerDay(input) {
    const today = toDate(input.today ?? new Date());
    const readings = [...(input.odometerReadings ?? [])]
        .filter((r) => toDate(r.date).getTime() <= today.getTime())
        .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
    for (let i = readings.length - 1; i >= 0; i -= 1) {
        const reading = readings[i];
        const days = daysBetween(reading.date, today);
        if (days >= 1 && input.odometerKm > reading.km) {
            const kmPerDay = (input.odometerKm - reading.km) / days;
            return Math.round(kmPerDay * 10) / 10;
        }
    }
    return DEFAULT_KM_PER_DAY[usageProfileOf(input)];
}
function usageProfileOf(input) {
    return input.usageProfile ?? "urbano";
}
/** Días desde la última lectura de odómetro registrada (null si no hay ninguna). */
export function lastReadingDaysAgo(input) {
    const today = toDate(input.today ?? new Date());
    const readings = (input.odometerReadings ?? []).filter((r) => toDate(r.date).getTime() <= today.getTime());
    if (readings.length === 0)
        return null;
    const latest = readings.reduce((a, b) => toDate(a.date).getTime() > toDate(b.date).getTime() ? a : b);
    return Math.max(0, daysBetween(latest.date, today));
}
/**
 * Estado de un ítem a partir del tiempo restante por km y por fecha.
 * 'próximo' = dentro de 1.000 km o 30 días.
 */
export function computeItemStatus(remainingKm, remainingDays) {
    const dueByKm = remainingKm !== null && remainingKm <= 0;
    const dueByTime = remainingDays !== null && remainingDays <= 0;
    if (dueByKm || dueByTime)
        return "vencido";
    const soonByKm = remainingKm !== null && remainingKm <= NEXT_WINDOW_KM;
    const soonByTime = remainingDays !== null && remainingDays <= NEXT_WINDOW_DAYS;
    if (soonByKm || soonByTime)
        return "proximo";
    return "al_dia";
}
export function priorityFor(status) {
    switch (status) {
        case "vencido":
            return "alta";
        case "proximo":
            return "media";
        default:
            return "baja";
    }
}
function formatVencido(km, days) {
    const parts = [];
    if (km !== null && km <= 0)
        parts.push(`hace ${Math.abs(km)} km`);
    if (days !== null && days <= 0) {
        const months = Math.max(1, Math.abs(Math.round(days / DAYS_PER_MONTH)));
        parts.push(`hace ${months} ${months === 1 ? "mes" : "meses"}`);
    }
    return parts.length > 0 ? `Vencido ${parts.join(" y ")}` : "Vencido";
}
function formatProximo(km, days) {
    if (km !== null && km <= NEXT_WINDOW_KM) {
        return `En ${Math.max(0, km)} km`;
    }
    if (days !== null && days <= NEXT_WINDOW_DAYS) {
        if (days >= 7) {
            const weeks = Math.round(days / 7);
            return `En ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
        }
        return `En ${Math.max(0, Math.round(days))} ${Math.max(0, Math.round(days)) === 1 ? "día" : "días"}`;
    }
    return "Próximo";
}
function buildReason(status, remainingKm, remainingDays, effKm, effMonths) {
    switch (status) {
        case "vencido":
            return formatVencido(remainingKm, remainingDays);
        case "proximo":
            return formatProximo(remainingKm, remainingDays);
        default: {
            const km = effKm === null ? "—" : String(effKm);
            const months = effMonths === null ? "—" : String(effMonths);
            return `Al día (cada ${km} km / ${months} meses)`;
        }
    }
}
function latestLastService(lastServices, serviceId) {
    const matches = lastServices
        .filter((s) => s.serviceId === serviceId)
        .sort((a, b) => {
        const aKm = a.km ?? 0;
        const bKm = b.km ?? 0;
        if (aKm !== bKm)
            return bKm - aKm;
        const aDate = a.date ? toDate(a.date).getTime() : 0;
        const bDate = b.date ? toDate(b.date).getTime() : 0;
        return bDate - aDate;
    });
    return matches[0];
}
/**
 * Calcula un ítem individual del plan para un subservicio periódico aplicable.
 * Devuelve null si no es aplicable o no tiene regla.
 */
export function computeItem(input, serviceId) {
    const today = toDate(input.today ?? new Date());
    const { classId, fuelId } = input.vehicle;
    if (!isServiceApplicable(serviceId, classId, fuelId))
        return null;
    const ref = findSubservice(serviceId);
    if (!ref || !ref.subservice.periodic)
        return null;
    const rule = resolveRules(classId, fuelId).find((r) => r.serviceId === serviceId);
    if (!rule)
        return null;
    const severe = (input.usageProfile ?? "urbano") === "severo";
    const factor = severe ? rule.severeFactor : 1;
    const effKm = rule.intervalKm === null ? null : Math.round(rule.intervalKm * factor);
    const effMonths = rule.intervalMonths === null ? null : rule.intervalMonths * factor;
    const last = latestLastService(input.lastServices ?? [], serviceId);
    const baseKm = last?.km ?? input.odometerKm;
    const baseDate = last?.date ? toDate(last.date) : today;
    const kmActive = effKm !== null;
    const monthsActive = effMonths !== null;
    const dueKm = kmActive ? baseKm + effKm : input.odometerKm;
    const dueDate = monthsActive ? addMonths(baseDate, effMonths) : today;
    const remainingKm = kmActive ? dueKm - input.odometerKm : null;
    const remainingDays = monthsActive ? daysBetween(today, dueDate) : null;
    const status = computeItemStatus(remainingKm, remainingDays);
    return {
        serviceId: ref.subservice.id,
        serviceName: ref.subservice.name,
        categoryId: ref.category.id,
        categoryName: ref.category.name,
        dueKm,
        dueDate,
        remainingKm,
        remainingDays,
        effKm,
        effMonths,
        status,
    };
}
/**
 * Construye el plan de mantenimiento de un vehículo.
 * Puro (sin E/S): los catálogos validados se cargan una vez al importar.
 */
export function buildPlan(input) {
    const today = toDate(input.today ?? new Date());
    const usageProfile = usageProfileOf(input);
    const computed = [];
    for (const category of serviceTaxonomy.categories) {
        for (const subservice of category.subservices) {
            if (!subservice.periodic)
                continue;
            const computation = computeItem(input, subservice.id);
            if (!computation)
                continue;
            computed.push({
                computation,
                item: {
                    categoryId: computation.categoryId,
                    categoryName: computation.categoryName,
                    serviceId: computation.serviceId,
                    serviceName: computation.serviceName,
                    dueKm: computation.dueKm,
                    dueDate: computation.dueDate,
                    status: computation.status,
                    priority: priorityFor(computation.status),
                    costRefUsd: subservice.costRefUsd,
                    durationMin: subservice.durationMin,
                    remainingKm: computation.remainingKm ?? 0,
                    remainingDays: computation.remainingDays ?? 0,
                    reason: buildReason(computation.status, computation.remainingKm, computation.remainingDays, computation.effKm, computation.effMonths),
                },
            });
        }
    }
    const urgency = (c) => {
        const { remainingKm, remainingDays, effKm } = c.computation;
        const kmUrgency = effKm !== null ? (remainingKm ?? 0) : Number.MAX_SAFE_INTEGER;
        const timeUrgency = c.computation.effMonths !== null ? (remainingDays ?? 0) : Number.MAX_SAFE_INTEGER;
        return Math.min(kmUrgency, timeUrgency);
    };
    computed.sort((a, b) => {
        if (STATUS_ORDER[a.item.status] !== STATUS_ORDER[b.item.status]) {
            return STATUS_ORDER[a.item.status] - STATUS_ORDER[b.item.status];
        }
        const aUrgency = urgency(a);
        const bUrgency = urgency(b);
        if (aUrgency !== bUrgency)
            return aUrgency - bUrgency;
        return a.item.serviceId.localeCompare(b.item.serviceId);
    });
    const items = computed.map((c) => c.item);
    return {
        generatedAt: today,
        vehicle: input.vehicle,
        odometerKm: input.odometerKm,
        kmPerDay: estimateKmPerDay(input),
        lastReadingDaysAgo: lastReadingDaysAgo(input),
        usageProfile,
        items,
    };
}
//# sourceMappingURL=plan-engine.js.map