import type { LLMProvider, LLMMessage, LLMResponse, ToolDefinition } from "../types.js";
export declare class OpenAIProvider implements LLMProvider {
    private apiKey;
    private adapter;
    constructor(config?: {
        apiKey?: string;
        baseUrl?: string;
    });
    chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;
}
//# sourceMappingURL=openai.d.ts.map