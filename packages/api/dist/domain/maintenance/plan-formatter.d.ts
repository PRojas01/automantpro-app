import type { MaintenancePlan } from "./types.js";
export interface SelectedService {
    serviceId: string;
    name: string;
    costRefUsd: number;
    durationMin: number;
}
export interface PlanFormatContext {
    label: string;
    plan: MaintenancePlan;
    maxLength?: number;
}
/** Da formato a un número de kilómetros con separador de miles es-EC (p. ej. 45.000). */
export declare function formatKm(value: number): string;
/** Da formato a una duración: "1 h 30 min" o "45 min". */
export declare function formatDuration(totalMin: number): string;
/**
 * Arma páginas de texto (cada una ≤ maxLength) repetiendo el encabezado
 * en cada página; el pie solo va en la última.
 */
export declare function paginateText(headerLines: string[], blocks: string[], footerLines: string[], maxLength?: number): string[];
/**
 * Formatea el plan como texto de WhatsApp (docs/33 §3 paso 2).
 * Devuelve una o más páginas, cada una ≤ 1024 caracteres.
 */
export declare function formatPlanWhatsApp(ctx: PlanFormatContext): string[];
/**
 * Formatea la selección de servicios (docs/33 §3 paso 3):
 * resumen de lo elegido con total referencial, duración y acciones.
 */
export declare function formatServiceSelection(selected: SelectedService[]): string;
//# sourceMappingURL=plan-formatter.d.ts.map