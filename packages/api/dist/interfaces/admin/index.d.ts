import type { FastifyInstance } from "fastify";
import { type AdminStore } from "../../infrastructure/admin/admin-store.js";
import { type SqlConnection } from "../../infrastructure/schema-setup/apply.js";
export interface AdminPanelOptions {
    store?: AdminStore;
    connect?: () => Promise<SqlConnection>;
}
declare module "fastify" {
    interface FastifyRequest {
        cspNonce: string;
    }
}
export declare function adminPanelRoutes(app: FastifyInstance, options?: AdminPanelOptions): Promise<void>;
export default adminPanelRoutes;
//# sourceMappingURL=index.d.ts.map