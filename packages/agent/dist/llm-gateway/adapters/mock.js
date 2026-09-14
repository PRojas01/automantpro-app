import { MockLLMProvider } from "../../llm/mock.js";
export class MockLLMAdapter {
    provider;
    constructor(provider = new MockLLMProvider()) {
        this.provider = provider;
    }
    async complete(params) {
        if (params.tier === "transcribe") {
            return { content: "transcripción de nota de voz (mock)" };
        }
        const response = await this.provider.chat(params.messages, params.tools);
        return {
            content: response.content,
            tool_calls: response.tool_calls,
        };
    }
}
export function fromLegacyProvider(provider) {
    return new MockLLMAdapter(provider);
}
//# sourceMappingURL=mock.js.map