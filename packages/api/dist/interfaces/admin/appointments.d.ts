import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import type { WorkOrderStore } from "../../infrastructure/work-orders/work-order-store.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { RelationLinker } from "../../application/relations/linker.js";
import { type PlatformSettings } from "../../application/settings/platform.js";
export interface AppointmentDeps {
    /** Crea el vínculo dueño ↔ taller al agendar (docs/35 §1). */
    linker?: RelationLinker;
    /** Ajustes de operación: interruptor de turnos (docs/35 A2). */
    platform?: () => Promise<PlatformSettings>;
    appointments: AppointmentStore;
    registrations: RegistrationStore;
    workOrders?: WorkOrderStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerAppointmentRoutes(app: FastifyInstance, deps: AppointmentDeps): void;
//# sourceMappingURL=appointments.d.ts.map