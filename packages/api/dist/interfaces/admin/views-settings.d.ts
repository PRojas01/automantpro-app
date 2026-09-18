import type { Flash } from "./views-setup.js";
import { type LegalData } from "../../application/legal/documents.js";
import type { CopilotStatus } from "../../application/copilot/service.js";
import { type PlatformSettings } from "../../application/settings/platform.js";
export declare function settingsView(input: {
    csrf: string;
    whatsapp: {
        stored: string | null;
        env: string | null;
    };
    db: {
        present: number;
        total: number;
    } | null;
    legal?: LegalData;
    ai?: CopilotStatus | null;
    platform?: PlatformSettings;
    flash?: Flash;
}): string;
//# sourceMappingURL=views-settings.d.ts.map