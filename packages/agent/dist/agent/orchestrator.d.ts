import type { ToolResult } from "../types.js";
import type { LLMProvider } from "../types.js";
import type { GatewayConfig } from "../llm-gateway/config.js";
import { InMemoryToolCallStore, InMemoryUsageStore } from "../llm-gateway/ports.js";
export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;
type ProviderKind = "mock" | "openai";
interface SystemMessage {
    role: "user" | "assistant";
    content: string;
}
export declare class AgentOrchestrator {
    private readonly providerKind;
    private toolHandlers;
    private sessions;
    private readonly promptStore;
    private readonly usageStore;
    private readonly toolCallStore;
    private readonly quota;
    private cycle;
    private contextSheet;
    private adapterOverride;
    private configOverride;
    constructor(provider?: ProviderKind);
    setContextSheet(context: string): void;
    setConfig(config: GatewayConfig): void;
    setLLMProvider(provider: LLMProvider): void;
    registerTool(name: string, handler: ToolHandler): void;
    getRegisteredTools(): string[];
    handleIncoming(sessionId: string, userMessage: string): Promise<string>;
    restoreSession(sessionId: string, messages: SystemMessage[]): void;
    getSessionMessages(sessionId: string): SystemMessage[];
    clearSession(sessionId: string): void;
    getUsage(): ReturnType<InMemoryUsageStore["list"]>;
    getToolCalls(): ReturnType<InMemoryToolCallStore["list"]>;
    private ensureCycle;
    private runCycle;
    private registerDefaultTools;
}
export {};
//# sourceMappingURL=orchestrator.d.ts.map