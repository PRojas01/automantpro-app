import type { FastifyInstance } from "fastify";
import { type AdminStore } from "../../infrastructure/admin/admin-store.js";
import { type SqlConnection } from "../../infrastructure/schema-setup/apply.js";
import { type AppointmentStore } from "../../infrastructure/appointments/appointment-store.js";
import { type RegistrationStore } from "../../infrastructure/registration/registration-store.js";
import { type SettingsStore } from "../../infrastructure/settings/settings-store.js";
export interface AdminPanelOptions {
    store?: AdminStore;
    connect?: () => Promise<SqlConnection>;
    settings?: SettingsStore;
    registrations?: RegistrationStore;
    appointments?: AppointmentStore;
    /** Se llama cuando cambia un ajuste, para refrescar cachés (por ejemplo, el número de la página de inicio). */
    onSettingsChanged?: () => void;
}
declare module "fastify" {
    interface FastifyRequest {
        cspNonce: string;
    }
}
export declare function adminPanelRoutes(app: FastifyInstance, options?: AdminPanelOptions): Promise<void>;
export default adminPanelRoutes;
//# sourceMappingURL=index.d.ts.map