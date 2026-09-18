import type { PendingTask } from "../../application/attend/welcome.js";
import type { UserDetail } from "../../infrastructure/registration/registration-store.js";
import type { Visit } from "../../infrastructure/visits/visit-store.js";
import type { CopilotStatus, DraftResult } from "../../application/copilot/service.js";
import { type LimitState, type PlanKey } from "../../application/plans/plans.js";
export interface AttendResult {
    /** Perfil que declaró el contacto en su mensaje, si se pudo detectar. */
    intent?: string | null;
    /** Plan vigente del contacto y su uso del plan gratuito (docs/42). */
    plan?: PlanKey;
    limits?: LimitState[];
    /** Mensaje con el enlace de talleres cercanos, para quien no tiene plan pagado. */
    nearby?: string | null;
    phone: string | null;
    code: string | null;
    visit: Visit | null;
    visitLookup: boolean;
    detail: UserDetail | null;
    tasks: PendingTask[];
    message: string;
}
export declare function attendView(input: {
    csrf: string;
    query: string;
    result?: AttendResult;
    error?: string;
    copilot?: CopilotStatus | null;
    draft?: DraftResult | null;
    customerText?: string;
    instruction?: string;
    flash?: string;
    notice?: string;
}): string;
//# sourceMappingURL=views-attend.d.ts.map