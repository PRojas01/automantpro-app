import type { LLMProvider, LLMMessage, LLMResponse, ToolDefinition } from "../types.js";
export declare class MockLLMProvider implements LLMProvider {
    private greeting;
    chat(messages: LLMMessage[], _tools?: ToolDefinition[]): Promise<LLMResponse>;
    reset(): void;
}
//# sourceMappingURL=mock.d.ts.map