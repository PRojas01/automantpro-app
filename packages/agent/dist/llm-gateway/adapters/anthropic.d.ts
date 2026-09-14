import type { GatewayCompletion, GatewayParams, LLMAdapter } from "../types.js";
import type { GatewayConfig } from "../config.js";
export declare class AnthropicAdapter implements LLMAdapter {
    private readonly cfg;
    constructor(cfg: GatewayConfig);
    private resolveModel;
    private baseUrl;
    complete(params: GatewayParams): Promise<GatewayCompletion>;
}
//# sourceMappingURL=anthropic.d.ts.map