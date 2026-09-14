import { buildPlan, formatPlanWhatsApp } from "../../domain/maintenance/index.js";
const USAGE = ["urbano", "carretera", "severo"];
/**
 * Plan de mantenimiento del vehículo como texto de WhatsApp, listo para que el operador lo copie
 * en la fase 1. null si faltan clase o combustible, o si no hay reglas para esa combinación.
 */
export function planTextFor(vehicle) {
    const classId = vehicle.vehicleClass ? String(vehicle.vehicleClass) : "";
    const fuelId = vehicle.fuel ? String(vehicle.fuel) : "";
    if (!classId || !fuelId)
        return null;
    try {
        const usage = USAGE.includes(String(vehicle.usageProfile)) ? String(vehicle.usageProfile) : "urbano";
        const plan = buildPlan({
            vehicle: { classId, fuelId },
            odometerKm: Number(vehicle.currentKm) || 0,
            usageProfile: usage,
        });
        if (plan.items.length === 0)
            return null;
        const label = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");
        return formatPlanWhatsApp({ label, plan }).join("\n\n");
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=plan-text.js.map