import type { GatewayCompletion, GatewayParams, LLMAdapter } from "../types.js";
import type { GatewayConfig } from "../config.js";
export declare class OpenAIAdapter implements LLMAdapter {
    private readonly cfg;
    constructor(cfg: GatewayConfig);
    private resolveModel;
    private baseUrl;
    private formatMessages;
    private transcribe;
    complete(params: GatewayParams): Promise<GatewayCompletion>;
}
//# sourceMappingURL=openai.d.ts.map