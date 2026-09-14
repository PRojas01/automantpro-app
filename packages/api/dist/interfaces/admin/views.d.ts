import type { DashboardData, Page } from "../../infrastructure/admin/admin-store.js";
export declare function layout(input: {
    title: string;
    nonce: string;
    body: string;
    csrfToken?: string;
    nav?: boolean;
}): string;
export declare function loginView(error?: string): string;
export declare function twoFactorView(error?: string): string;
export declare function messageView(title: string, text: string): string;
export declare function dashboardView(input: {
    data: DashboardData | null;
    version: string;
    uptimeSeconds: number;
    dbError?: string;
    recent?: Array<Record<string, unknown>> | null;
    pendingVerifications?: number | null;
}): string;
export declare function tableView(title: string, base: string, page: Page<Record<string, unknown>>, columns: Array<[string, string]>): string;
//# sourceMappingURL=views.d.ts.map