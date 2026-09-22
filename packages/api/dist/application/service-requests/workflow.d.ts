export type RequestStatus = "abierta" | "cerrada" | "cancelada";
export type OfferStatus = "invitado" | "ofertado" | "sin_disponibilidad" | "elegido" | "descartado";
export declare const REQUEST_STATUS_LABELS: Record<RequestStatus, string>;
export declare const OFFER_STATUS_LABELS: Record<OfferStatus, string>;
/** Máximo de talleres invitados por solicitud: suficiente para comparar, sin spam. */
export declare const MAX_SHOPS_PER_REQUEST = 5;
export declare const serviceRequestCode: (number: number) => string;
export declare const CATEGORIES: Array<{
    id: string;
    name: string;
}>;
export declare function categoryName(id: string): string;
export interface ShopCandidate {
    id: string;
    name: string;
    city: string;
    zone: string | null;
    services: string[];
    ratingAvg: number;
}
export interface RankedShop extends ShopCandidate {
    /** Atiende la especialidad pedida. */
    specialist: boolean;
    /** Está en la misma zona de la ciudad. */
    sameZone: boolean;
    score: number;
}
/**
 * Ordena los talleres para una solicitud: primero los que atienden esa especialidad, luego los de
 * la misma zona y, entre iguales, los mejor calificados.
 */
export declare function rankShopsFor(candidates: ShopCandidate[], category: string, zone: string | null): RankedShop[];
/** Los que se invitan: especialistas primero; si no hay suficientes, se completa con el resto. */
export declare function shopsToInvite(ranked: RankedShop[], max?: number): RankedShop[];
export interface RequestSummary {
    number: number;
    category: string;
    description: string;
    vehicle: string | null;
    city: string | null;
    zone: string | null;
}
/** Mensaje que recibe cada taller invitado. Sin datos del dueño: la conversación sigue mediada. */
export declare function invitationMessage(request: RequestSummary): string;
export interface OfferSummary {
    shopName: string;
    priceUsd: number | null;
    durationMin: number | null;
    availability: string | null;
    warrantyDays: number | null;
}
/** Comparación que recibe el dueño con las respuestas de los talleres. */
export declare function comparisonMessage(request: RequestSummary, offers: OfferSummary[]): string;
/** Monto con hasta dos decimales; null si no es válido. */
export declare function parsePrice(input: unknown): number | null;
//# sourceMappingURL=workflow.d.ts.map