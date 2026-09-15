import type { Flash } from "./views-setup.js";
import { type LegalData } from "../../application/legal/documents.js";
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
    flash?: Flash;
}): string;
//# sourceMappingURL=views-settings.d.ts.map