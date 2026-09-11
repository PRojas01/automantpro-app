import type { LLMProvider, ToolResult } from "../types.js";
export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;
export declare class AgentOrchestrator {
    private llm;
    private toolHandlers;
    private sessions;
    constructor(provider?: "mock" | "openai");
    setLLMProvider(provider: LLMProvider): void;
    registerTool(name: string, handler: ToolHandler): void;
    getRegisteredTools(): string[];
    handleIncoming(sessionId: string, userMessage: string): Promise<string>;
    getSessionMessages(sessionId: string): {
        role: string;
        content: string;
    }[];
    clearSession(sessionId: string): void;
    private convertToolCalls;
    private executeToolCalls;
    private buildToolResponse;
    private registerDefaultTools;
}
//# sourceMappingURL=orchestrator.d.ts.map