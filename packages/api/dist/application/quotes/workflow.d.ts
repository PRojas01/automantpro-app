export declare const REQUEST_LABELS: Record<string, string>;
export declare const QUOTE_LABELS: Record<string, string>;
export type OrderStage = "confirmado" | "preparando" | "despachado" | "entregado" | "cancelado";
export declare const ORDER_STAGE_LABELS: Record<string, string>;
export declare const ORDER_STAGE_TRANSITIONS: Record<string, OrderStage[]>;
/** Equivalencia con el estado original de la tabla Order, que usa la API existente. */
export declare const ORDER_STATUS_FOR_STAGE: Record<OrderStage, "requested" | "accepted" | "fulfilled" | "cancelled">;
export declare const LOSS_REASONS: Array<[string, string]>;
export declare const MAX_STORES_PER_REQUEST = 5;
export declare const quoteRequestCode: (number: number) => string;
export interface RequestLike {
    number: number;
    partName: string;
    partCode: string | null;
    quantity: number;
    city: string;
    notes: string | null;
    vehicleLabel: string | null;
    plate: string | null;
}
export interface QuoteLike {
    status: string;
    storeName: string;
    unitPrice: number | null;
    brand: string | null;
    availability: string | null;
    warrantyDays: number | null;
    deliveryTime: string | null;
    validDays: number | null;
    notes: string | null;
}
/** Cotizaciones con precio, de la más barata a la más cara. */
export declare function rankQuotes<T extends QuoteLike>(quotes: T[]): T[];
export declare function storeRequestMessage(r: RequestLike): string;
export declare function comparisonMessage(r: RequestLike, quotes: QuoteLike[]): string;
export interface OrderLike {
    stage: string;
    requestNumber: number;
    storeName: string;
    partName: string;
    quantity: number;
    total: number;
    brand: string | null;
    deliveryTime: string | null;
    cancelReason: string | null;
}
export declare function requesterOrderMessage(o: OrderLike): string;
export declare function storeOrderMessage(o: OrderLike): string;
export declare function lostQuoteMessage(r: {
    number: number;
    partName: string;
}): string;
//# sourceMappingURL=workflow.d.ts.map