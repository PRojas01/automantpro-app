import { OpenAIAdapter } from "../llm-gateway/adapters/openai.js";
import { buildConfig } from "../llm-gateway/config.js";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export class OpenAIProvider {
    apiKey;
    adapter;
    constructor(config) {
        this.apiKey = config?.apiKey ?? process.env.LLM_API_KEY ?? "";
        this.adapter = new OpenAIAdapter(buildConfig({
            provider: "openai",
            apiKey: this.apiKey || undefined,
            baseUrl: config?.baseUrl ?? process.env.LLM_BASE_URL ?? DEFAULT_OPENAI_BASE_URL,
            models: {
                fast: process.env.LLM_MODEL_FAST,
                smart: process.env.LLM_MODEL_SMART,
                vision: process.env.LLM_MODEL_VISION,
                transcribe: process.env.LLM_MODEL_TRANSCRIBE,
            },
            timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 12000),
        }));
    }
    async chat(messages, tools) {
        if (!this.apiKey) {
            throw new Error("LLM_API_KEY is required for OpenAI provider");
        }
        const response = await this.adapter.complete({
            agent: "owner",
            tier: "fast",
            messages,
            tools,
        });
        return {
            content: response.content,
            tool_calls: response.tool_calls,
        };
    }
}
//# sourceMappingURL=openai.js.map