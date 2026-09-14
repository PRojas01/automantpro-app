import type { FastifyInstance } from "fastify";
import type { AdminStore } from "../../infrastructure/admin/admin-store.js";
import { type SqlConnection } from "../../infrastructure/schema-setup/apply.js";
export declare const SETUP_COOKIE = "amp_admin_setup";
export declare function resetSetupWizardForTests(): void;
export interface SetupWizardDeps {
    store: AdminStore;
    connect: () => Promise<SqlConnection>;
    dbConfigured: () => boolean;
}
export declare function qrSvg(text: string): Promise<string>;
/** Cantidad de administradores; 0 si aún no existen las tablas; null si la base no responde. */
export declare function adminCount(store: AdminStore): Promise<number | null>;
export declare function registerSetupWizard(app: FastifyInstance, deps: SetupWizardDeps): void;
//# sourceMappingURL=setup-wizard.d.ts.map