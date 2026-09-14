import type { GatewayCompletion, GatewayParams, LLMAdapter } from "../types.js";
import type { LLMProvider } from "../../types.js";
export declare class MockLLMAdapter implements LLMAdapter {
    private readonly provider;
    constructor(provider?: LLMProvider);
    complete(params: GatewayParams): Promise<GatewayCompletion>;
}
export declare function fromLegacyProvider(provider: LLMProvider): LLMAdapter;
//# sourceMappingURL=mock.d.ts.map