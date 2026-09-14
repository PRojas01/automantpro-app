import type { FastifyInstance } from "fastify";
import { type SqlConnection } from "../../infrastructure/schema-setup/apply.js";
import { type AdminStore } from "../../infrastructure/admin/admin-store.js";
export interface SetupRoutesOptions {
    connect?: () => Promise<SqlConnection>;
    adminStore?: AdminStore;
    env?: NodeJS.ProcessEnv;
}
export declare function tokenMatches(provided: unknown, expected: string): boolean;
export declare function setupRoutes(app: FastifyInstance, options?: SetupRoutesOptions): Promise<void>;
export default setupRoutes;
//# sourceMappingURL=index.d.ts.map