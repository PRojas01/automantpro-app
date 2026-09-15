import type { SqlConnection } from "../schema-setup/apply.js";
export interface CopilotUsage {
    provider: string;
    model: string;
    promptVersion: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    costUsd: number;
    latencyMs: number;
    outcome: "ok" | "fallback" | "error";
}
export interface CopilotStore {
    recordUsage(usage: CopilotUsage): Promise<string>;
    spentBetween(start: Date, end: Date): Promise<number>;
    saveFeedback(input: {
        usageId: string;
        userId: string | null;
        good: boolean;
        reason: string | null;
    }): Promise<void>;
    feedbackSummary(since: Date): Promise<{
        good: number;
        bad: number;
    }>;
}
export declare class MysqlCopilotStore implements CopilotStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    recordUsage(usage: CopilotUsage): Promise<string>;
    spentBetween(start: Date, end: Date): Promise<number>;
    saveFeedback(input: {
        usageId: string;
        userId: string | null;
        good: boolean;
        reason: string | null;
    }): Promise<void>;
    feedbackSummary(since: Date): Promise<{
        good: number;
        bad: number;
    }>;
}
//# sourceMappingURL=copilot-store.d.ts.map