import { buildPlan, formatPlanWhatsApp } from "../../domain/maintenance/index.js";
const USAGE = ["urbano", "carretera", "severo"];
function planFor(vehicle) {
    const classId = vehicle.vehicleClass ? String(vehicle.vehicleClass) : "";
    const fuelId = vehicle.fuel ? String(vehicle.fuel) : "";
    if (!classId || !fuelId)
        return null;
    try {
        const usage = USAGE.includes(String(vehicle.usageProfile)) ? String(vehicle.usageProfile) : "urbano";
        return buildPlan({ vehicle: { classId, fuelId }, odometerKm: Number(vehicle.currentKm) || 0, usageProfile: usage });
    }
    catch {
        return null;
    }
}
/** Ítems del plan del vehículo (vacío si faltan clase o combustible). */
export function planItemsFor(vehicle) {
    return planFor(vehicle)?.items ?? [];
}
/**
 * Plan de mantenimiento del vehículo como texto de WhatsApp, listo para que el operador lo copie
 * en la fase 1. null si faltan clase o combustible, o si no hay reglas para esa combinación.
 */
export function planTextFor(vehicle) {
    const plan = planFor(vehicle);
    if (!plan || plan.items.length === 0)
        return null;
    const label = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");
    return formatPlanWhatsApp({ label, plan }).join("\n\n");
}
//# sourceMappingURL=plan-text.js.map