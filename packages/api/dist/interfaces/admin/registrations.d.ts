import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
import type { QuoteStore } from "../../infrastructure/quotes/quote-store.js";
import type { RelationStore } from "../../infrastructure/relations/relation-store.js";
import type { DataStore } from "../../infrastructure/data/data-store.js";
import { type PlatformSettings } from "../../application/settings/platform.js";
export interface RegistrationDeps {
    registrations: RegistrationStore;
    /** Vínculos y sanciones de la entidad, para la tarjeta de moderación (docs/35). */
    relations?: RelationStore;
    /** Ajustes de operación: ciudades activas (docs/35 A2). */
    platform?: () => Promise<PlatformSettings>;
    /** Solicitudes de la LOPDP del titular (docs/35 A3). */
    data?: DataStore;
    appointments?: AppointmentStore;
    workOrders?: WorkOrderStore;
    quotes?: QuoteStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerRegistrationRoutes(app: FastifyInstance, deps: RegistrationDeps): void;
//# sourceMappingURL=registrations.d.ts.map