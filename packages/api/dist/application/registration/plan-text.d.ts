import type { PlanItem } from "../../domain/maintenance/types.js";
/** Ítems del plan del vehículo (vacío si faltan clase o combustible). */
export declare function planItemsFor(vehicle: Record<string, unknown>): PlanItem[];
/**
 * Plan de mantenimiento del vehículo como texto de WhatsApp, listo para que el operador lo copie
 * en la fase 1. null si faltan clase o combustible, o si no hay reglas para esa combinación.
 */
export declare function planTextFor(vehicle: Record<string, unknown>): string | null;
//# sourceMappingURL=plan-text.d.ts.map