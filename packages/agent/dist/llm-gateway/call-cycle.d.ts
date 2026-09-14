import type { CircuitBreaker, CycleResult, CycleRunParams, LLMAdapter } from "./types.js";
import type { GatewayConfig } from "./config.js";
import type { PromptStore, QuotaPort, ToolCallStore, ToolExecutor, UsageStore } from "./ports.js";
export declare class ProviderCircuitBreaker implements CircuitBreaker {
    private readonly threshold;
    private readonly openMs;
    private readonly now;
    private consecutiveFailures;
    private openedAtMs;
    constructor(threshold?: number, openMs?: number, now?: () => number);
    isOpen(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
}
export interface CallCycleDeps {
    adapter: LLMAdapter;
    promptStore: PromptStore;
    executor: ToolExecutor;
    quota?: QuotaPort;
    usageStore?: UsageStore;
    toolCallStore?: ToolCallStore;
    config?: GatewayConfig;
    circuitBreaker?: CircuitBreaker;
    delay?: (ms: number) => Promise<void>;
    now?: () => number;
}
export declare class CallCycle {
    private readonly deps;
    private readonly config;
    private readonly delay;
    private readonly circuit;
    private readonly provider;
    private readonly model;
    constructor(deps: CallCycleDeps);
    get circuitBreaker(): CircuitBreaker;
    private buildMessages;
    private toGatewayParams;
    private usageRecord;
    private recordToolCall;
    private callWithRetry;
    private validateAgainstSchema;
    private performCall;
    private processToolCalls;
    run(params: CycleRunParams): Promise<CycleResult>;
}
//# sourceMappingURL=call-cycle.d.ts.map