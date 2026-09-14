import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { RegistrationStore } from "../../infrastructure/registration/registration-store.js";
export interface RegistrationDeps {
    registrations: RegistrationStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
}
export declare function registerRegistrationRoutes(app: FastifyInstance, deps: RegistrationDeps): void;
//# sourceMappingURL=registrations.d.ts.map