import { type GatewayConfig, type LLMAdapter, type ProviderName } from "@automantpro/agent";
import type { SettingsStore } from "../../infrastructure/settings/settings-store.js";
import type { CopilotStore } from "../../infrastructure/copilot/copilot-store.js";
import type { ContactContext } from "../attend/welcome.js";
export declare const AI_ENABLED_KEY = "ai.enabled";
export declare const AI_BUDGET_KEY = "ai.dailyBudgetUsd";
export declare const DEFAULT_DAILY_BUDGET_USD = 1;
export interface CopilotEnv {
    provider: ProviderName | null;
    model: string | null;
    missing: string[];
    priceInput: number;
    priceOutput: number;
    pricesDefaulted: boolean;
    config: GatewayConfig | null;
}
export declare function readCopilotEnv(env: NodeJS.ProcessEnv): CopilotEnv;
export declare function estimateCost(inputTokens: number, outputTokens: number, env: Pick<CopilotEnv, "priceInput" | "priceOutput">): number;
export interface CopilotStatus {
    provider: string | null;
    model: string | null;
    missing: string[];
    pricesDefaulted: boolean;
    enabled: boolean;
    budgetUsd: number;
    spentTodayUsd: number | null;
    feedback: {
        good: number;
        bad: number;
    } | null;
    available: boolean;
    reason: string | null;
}
export type DraftResult = {
    ok: true;
    reply: string;
    note: string | null;
    usageId: string | null;
    costUsd: number;
} | {
    ok: false;
    reason: "disabled" | "not_configured" | "budget" | "error";
    message: string;
    usageId: string | null;
};
export interface CopilotDeps {
    settings: SettingsStore;
    store: CopilotStore;
    env?: NodeJS.ProcessEnv;
    adapterFactory?: (config: GatewayConfig) => LLMAdapter;
    now?: () => Date;
}
export declare class CopilotService {
    private readonly deps;
    constructor(deps: CopilotDeps);
    private env;
    private enabled;
    private budget;
    private spentToday;
    status(): Promise<CopilotStatus>;
    setEnabled(enabled: boolean, updatedBy: string): Promise<void>;
    setBudget(amount: number, updatedBy: string): Promise<void>;
    draft(input: {
        ctx: ContactContext;
        customerText: string;
        instruction: string | null;
        firstName: string | null;
    }): Promise<DraftResult>;
    private record;
    feedback(input: {
        usageId: string;
        userId: string | null;
        good: boolean;
        reason: string | null;
    }): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map