import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "@prisma/client";
declare module "fastify" {
    interface FastifyRequest {
        userId: string;
        userRole: Role;
    }
}
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function requireRole(...roles: Role[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function registerAuth(app: FastifyInstance): Promise<void>;
declare module "fastify" {
    interface FastifyInstance {
        authenticate: typeof authenticate;
        requireRole: typeof requireRole;
    }
}
//# sourceMappingURL=auth.d.ts.map