import type { BuildPlanInput, DateInput, MaintenancePlan, PlanItemStatus, Priority } from "./types.js";
export declare function toDate(input: DateInput): Date;
/** Días transcurridos de `a` a `b` (positivo si b es posterior), normalizado a UTC. */
export declare function daysBetween(a: DateInput, b: DateInput): number;
export declare function addMonths(date: DateInput, months: number): Date;
/**
 * Estima el kilometraje recorrido por día usando la lectura más reciente
 * anterior al odómetro actual. Sin lecturas, usa el promedio por perfil de uso.
 */
export declare function estimateKmPerDay(input: BuildPlanInput): number;
/** Días desde la última lectura de odómetro registrada (null si no hay ninguna). */
export declare function lastReadingDaysAgo(input: BuildPlanInput): number | null;
/**
 * Estado de un ítem a partir del tiempo restante por km y por fecha.
 * 'próximo' = dentro de 1.000 km o 30 días.
 */
export declare function computeItemStatus(remainingKm: number | null, remainingDays: number | null): PlanItemStatus;
export declare function priorityFor(status: PlanItemStatus): Priority;
export interface ItemComputation {
    serviceId: string;
    serviceName: string;
    categoryId: string;
    categoryName: string;
    dueKm: number;
    dueDate: Date;
    remainingKm: number | null;
    remainingDays: number | null;
    effKm: number | null;
    effMonths: number | null;
    status: PlanItemStatus;
}
/**
 * Calcula un ítem individual del plan para un subservicio periódico aplicable.
 * Devuelve null si no es aplicable o no tiene regla.
 */
export declare function computeItem(input: BuildPlanInput, serviceId: string): ItemComputation | null;
/**
 * Construye el plan de mantenimiento de un vehículo.
 * Puro (sin E/S): los catálogos validados se cargan una vez al importar.
 */
export declare function buildPlan(input: BuildPlanInput): MaintenancePlan;
//# sourceMappingURL=plan-engine.d.ts.map