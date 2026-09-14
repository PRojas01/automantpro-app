import type { LLMAdapter, ModelTier } from "./types.js";
export type ProviderName = "openai" | "anthropic" | "mock";
export interface GatewayConfig {
    provider: ProviderName;
    apiKey?: string;
    baseUrl: string;
    models: Partial<Record<ModelTier, string>>;
    timeoutMs: number;
    dailyBudgetUsd: number;
    maxRounds: number;
    retryBaseDelayMs: number;
    circuitThreshold: number;
    circuitOpenMs: number;
}
export declare const DEFAULT_TIMEOUT_MS = 12000;
export declare function buildConfig(partial?: Partial<GatewayConfig>): GatewayConfig;
export declare function loadGatewayConfig(env?: NodeJS.ProcessEnv): GatewayConfig;
export declare function createAdapter(cfg: GatewayConfig): LLMAdapter;
//# sourceMappingURL=config.d.ts.map