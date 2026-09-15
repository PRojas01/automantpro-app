import type { SqlConnection } from "../schema-setup/apply.js";
import type { Page } from "../admin/admin-store.js";
import { type OrderStage } from "../../application/quotes/workflow.js";
export type QuoteRequestFilter = "abiertas" | "con_pedido" | "todas";
export interface StoreCandidate {
    id: string;
    name: string;
    city: string;
    zone: string | null;
    categories: string | null;
    delivery: boolean;
}
export interface QuoteRequestRow {
    id: string;
    number: number;
    status: string;
    requesterId: string;
    requesterName: string;
    requesterPhone: string;
    requesterRole: string;
    vehicleId: string | null;
    vehicleLabel: string | null;
    plate: string | null;
    workOrderId: string | null;
    partName: string;
    partCode: string | null;
    quantity: number;
    city: string;
    notes: string | null;
    closeReason: string | null;
    createdAt: Date | string;
}
export interface QuoteRow {
    id: string;
    requestId: string;
    storeId: string;
    storeName: string;
    storeCity: string;
    storeUserId: string;
    storePhone: string;
    status: string;
    unitPrice: number | null;
    brand: string | null;
    availability: string | null;
    warrantyDays: number | null;
    deliveryTime: string | null;
    validDays: number | null;
    notes: string | null;
    lossReason: string | null;
    respondedAt: Date | string | null;
}
export interface StoreQuoteRow extends QuoteRow {
    requestNumber: number;
    partName: string;
    requestStatus: string;
}
export interface PartsOrderRow {
    id: string;
    stage: string;
    status: string;
    total: number;
    cancelReason: string | null;
    createdAt: Date | string;
    quoteRequestId: string;
    quoteId: string | null;
    requestNumber: number;
    partName: string;
    quantity: number;
    storeId: string;
    storeName: string;
    storeUserId: string;
    storePhone: string;
    requesterId: string;
    requesterName: string;
    requesterPhone: string;
    unitPrice: number | null;
    brand: string | null;
    deliveryTime: string | null;
}
export interface NewQuoteRequest {
    requesterId: string;
    vehicleId: string | null;
    workOrderId: string | null;
    partName: string;
    partCode: string | null;
    quantity: number;
    city: string;
    notes: string | null;
    storeIds: string[];
}
export interface QuoteResponse {
    status: "cotizado" | "sin_stock";
    unitPrice: number | null;
    brand: string | null;
    availability: string | null;
    warrantyDays: number | null;
    deliveryTime: string | null;
    validDays: number | null;
    notes: string | null;
}
export interface UserQuotes {
    requests: QuoteRequestRow[];
    storeQuotes: StoreQuoteRow[];
    orders: PartsOrderRow[];
}
export interface QuoteStore {
    /** Almacenes verificados de la ciudad (cadena vacía: de todas las ciudades). */
    verifiedStores(city: string): Promise<StoreCandidate[]>;
    createRequest(input: NewQuoteRequest): Promise<string>;
    getRequest(id: string): Promise<{
        request: QuoteRequestRow;
        quotes: QuoteRow[];
        order: PartsOrderRow | null;
    } | null>;
    listRequests(filter: QuoteRequestFilter, page: number): Promise<Page<QuoteRequestRow>>;
    listForUser(userId: string): Promise<UserQuotes>;
    /** Registra la respuesta de un almacén; solo mientras la solicitud está abierta. */
    saveQuote(requestId: string, quoteId: string, response: QuoteResponse): Promise<boolean>;
    /** Elige una cotización: crea el pedido y descarta las demás. Devuelve el id del pedido o null. */
    choose(requestId: string, quoteId: string): Promise<string | null>;
    closeRequest(requestId: string, reason: string): Promise<boolean>;
    setLossReason(requestId: string, quoteId: string, reason: string): Promise<boolean>;
    setOrderStage(orderId: string, expected: string, next: OrderStage, cancelReason: string | null): Promise<boolean>;
}
export declare class MysqlQuoteStore implements QuoteStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    private transaction;
    verifiedStores(city: string): Promise<StoreCandidate[]>;
    createRequest(input: NewQuoteRequest): Promise<string>;
    getRequest(id: string): Promise<{
        request: QuoteRequestRow;
        quotes: QuoteRow[];
        order: PartsOrderRow | null;
    } | null>;
    listRequests(filter: QuoteRequestFilter, page: number): Promise<Page<QuoteRequestRow>>;
    listForUser(userId: string): Promise<UserQuotes>;
    saveQuote(requestId: string, quoteId: string, response: QuoteResponse): Promise<boolean>;
    choose(requestId: string, quoteId: string): Promise<string | null>;
    closeRequest(requestId: string, reason: string): Promise<boolean>;
    setLossReason(requestId: string, quoteId: string, reason: string): Promise<boolean>;
    setOrderStage(orderId: string, expected: string, next: OrderStage, cancelReason: string | null): Promise<boolean>;
}
//# sourceMappingURL=quote-store.d.ts.map