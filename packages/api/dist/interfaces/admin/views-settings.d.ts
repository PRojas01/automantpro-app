import type { Flash } from "./views-setup.js";
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
    flash?: Flash;
}): string;
//# sourceMappingURL=views-settings.d.ts.map