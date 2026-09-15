export type WorkOrderStatus = "recepcion" | "presupuesto_enviado" | "aprobado" | "rechazado" | "en_ejecucion" | "esperando_repuesto" | "cerrada" | "cancelada";
export declare const WORK_ORDER_LABELS: Record<string, string>;
/** Cambios de estado permitidos. El cierre (cerrada) se hace con su propio formulario. */
export declare const WORK_ORDER_TRANSITIONS: Record<string, WorkOrderStatus[]>;
/** Estados en los que se puede editar el presupuesto y el diagnóstico. */
export declare const EDITABLE_STATUSES: readonly string[];
export declare const OPEN_STATUSES: readonly string[];
export declare const IN_SHOP_STATUSES: readonly string[];
export declare const ITEM_KINDS: Array<[string, string]>;
export declare const DIAGNOSIS_OUTCOMES: Array<[string, string]>;
export declare const workOrderCode: (number: number) => string;
/** "45,50", "45.50", "1.234,56" o "$ 20" → número con hasta 2 decimales; null si no es válido. */
export declare function parseAmount(input: unknown): number | null;
export declare function formatUsd(value: number): string;
export interface WorkOrderItemLike {
    kind: string;
    description: string;
    brand: string | null;
    partCode: string | null;
    quantity: number;
    unitPrice: number;
}
export declare const lineTotal: (item: WorkOrderItemLike) => number;
export declare function itemsTotal(items: WorkOrderItemLike[]): number;
export interface MessageWorkOrder {
    number: number;
    status: string;
    shopName: string;
    vehicleLabel: string;
    plate: string | null;
    intakeKm: number | null;
    diagnosis: string | null;
    rejectionReason: string | null;
    cancelReason: string | null;
    exitKm: number | null;
    warrantyDays: number | null;
    nextService: string | null;
    total: number;
}
export declare function quoteMessage(o: MessageWorkOrder, items: WorkOrderItemLike[]): string;
/** Mensaje para el dueño según el estado de la orden. */
export declare function ownerWorkOrderMessage(o: MessageWorkOrder, items: WorkOrderItemLike[]): string;
/** Mensaje para el taller cuando el dueño responde el presupuesto. */
export declare function shopWorkOrderMessage(o: MessageWorkOrder): string | null;
/** Texto que queda en el historial del vehículo al cerrar la orden. */
export declare function historyDescription(o: MessageWorkOrder, items: WorkOrderItemLike[]): string;
//# sourceMappingURL=workflow.d.ts.map