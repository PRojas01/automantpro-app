import type { PendingTask } from "../../application/attend/welcome.js";
import type { UserDetail } from "../../infrastructure/registration/registration-store.js";
import type { Visit } from "../../infrastructure/visits/visit-store.js";
import type { CopilotStatus, DraftResult } from "../../application/copilot/service.js";
export interface AttendResult {
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
}): string;
//# sourceMappingURL=views-attend.d.ts.map