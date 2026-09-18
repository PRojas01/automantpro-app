import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
import type { QuoteStore } from "../../infrastructure/quotes/quote-store.js";
import type { RelationLinker } from "../../application/relations/linker.js";
import { type PlatformSettings } from "../../application/settings/platform.js";
export interface QuoteDeps {
    /** Crea un vínculo con cada almacén invitado (docs/35 §1). */
    linker?: RelationLinker;
    /** Ajustes de operación: interruptor de cotizaciones (docs/35 A2). */
    platform?: () => Promise<PlatformSettings>;
    quotes: QuoteStore;
    registrations: RegistrationStore;
    appointments: AppointmentStore;
    workOrders?: WorkOrderStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerQuoteRoutes(app: FastifyInstance, deps: QuoteDeps): void;
//# sourceMappingURL=quotes.d.ts.map