import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type AdminSession } from "../../application/admin/security.js";
import type { RelationStore } from "../../infrastructure/relations/relation-store.js";
export interface RelationDeps {
    relations: RelationStore;
    requireSession(request: FastifyRequest, reply: FastifyReply): AdminSession | null;
    html(reply: FastifyReply, request: FastifyRequest, title: string, body: string, session?: AdminSession, status?: number): FastifyReply;
    audit(eventType: string, actorUserId: string | null, reason: string): Promise<void>;
    /** Horas sin respuesta a partir de las cuales una relación se considera atrasada. */
    waitingHours?: number;
}
export declare function registerRelationRoutes(app: FastifyInstance, deps: RelationDeps): void;
//# sourceMappingURL=relations.d.ts.map