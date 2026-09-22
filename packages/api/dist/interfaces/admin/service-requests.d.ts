import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { ServiceRequestStore } from "../../infrastructure/service-requests/service-request-store.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import type { RelationLinker } from "../../application/relations/linker.js";
export interface ServiceRequestDeps {
    serviceRequests: ServiceRequestStore;
    registrations: RegistrationStore;
    linker?: RelationLinker;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerServiceRequestRoutes(app: FastifyInstance, deps: ServiceRequestDeps): void;
//# sourceMappingURL=service-requests.d.ts.map