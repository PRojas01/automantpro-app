import type { SqlConnection } from "../schema-setup/apply.js";
import type { ShopCandidate } from "../../application/service-requests/workflow.js";
export interface ServiceRequestRow {
    id: string;
    number: number;
    ownerId: string;
    ownerName: string;
    ownerPhone: string;
    vehicleId: string | null;
    vehicleLabel: string | null;
    category: string;
    description: string;
    city: string | null;
    zone: string | null;
    status: string;
    chosenOfferId: string | null;
    closeReason: string | null;
    createdAt: Date | string;
    /** Cuántos talleres respondieron ya. */
    respuestas?: number;
}
export interface ServiceOfferRow {
    id: string;
    requestId: string;
    shopId: string;
    shopName: string;
    shopUserId: string;
    shopCity: string;
    shopZone: string | null;
    status: string;
    priceUsd: number | null;
    durationMin: number | null;
    availability: string | null;
    warrantyDays: number | null;
    notes: string | null;
    respondedAt: Date | string | null;
}
export type ServiceRequestFilter = "abiertas" | "sin_respuesta" | "cerradas" | "todas";
export interface ServiceRequestStore {
    /** Talleres verificados de una ciudad, con sus especialidades, para elegir a quién invitar. */
    candidates(city: string): Promise<ShopCandidate[]>;
    create(input: {
        ownerId: string;
        vehicleId: string | null;
        category: string;
        description: string;
        city: string | null;
        zone: string | null;
        shopIds: string[];
        createdBy: string | null;
    }): Promise<string>;
    list(filter: ServiceRequestFilter, page: number): Promise<{
        items: ServiceRequestRow[];
        page: number;
        pageSize: number;
    }>;
    get(id: string): Promise<{
        request: ServiceRequestRow;
        offers: ServiceOfferRow[];
    } | null>;
    forUser(userId: string): Promise<ServiceRequestRow[]>;
    /** Registra la respuesta de un taller mientras la solicitud siga abierta. */
    saveOffer(requestId: string, offerId: string, response: {
        status: "ofertado" | "sin_disponibilidad";
        priceUsd: number | null;
        durationMin: number | null;
        availability: string | null;
        warrantyDays: number | null;
        notes: string | null;
    }): Promise<boolean>;
    /** Elige un taller: marca la oferta, descarta las demás y cierra la solicitud. */
    choose(requestId: string, offerId: string): Promise<boolean>;
    close(requestId: string, reason: string): Promise<boolean>;
}
export declare class MysqlServiceRequestStore implements ServiceRequestStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    candidates(city: string): Promise<ShopCandidate[]>;
    create(input: {
        ownerId: string;
        vehicleId: string | null;
        category: string;
        description: string;
        city: string | null;
        zone: string | null;
        shopIds: string[];
        createdBy: string | null;
    }): Promise<string>;
    list(filter: ServiceRequestFilter, page: number): Promise<{
        items: ServiceRequestRow[];
        page: number;
        pageSize: number;
    }>;
    get(id: string): Promise<{
        request: ServiceRequestRow;
        offers: ServiceOfferRow[];
    } | null>;
    forUser(userId: string): Promise<ServiceRequestRow[]>;
    saveOffer(requestId: string, offerId: string, response: {
        status: "ofertado" | "sin_disponibilidad";
        priceUsd: number | null;
        durationMin: number | null;
        availability: string | null;
        warrantyDays: number | null;
        notes: string | null;
    }): Promise<boolean>;
    choose(requestId: string, offerId: string): Promise<boolean>;
    close(requestId: string, reason: string): Promise<boolean>;
}
//# sourceMappingURL=service-request-store.d.ts.map