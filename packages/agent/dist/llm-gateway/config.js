import { OpenAIAdapter } from "./adapters/openai.js";
import { AnthropicAdapter } from "./adapters/anthropic.js";
import { MockLLMAdapter } from "./adapters/mock.js";
const TIERS = ["fast", "smart", "vision", "transcribe"];
const MODEL_ENV_VARS = {
    fast: "LLM_MODEL_FAST",
    smart: "LLM_MODEL_SMART",
    vision: "LLM_MODEL_VISION",
    transcribe: "LLM_MODEL_TRANSCRIBE",
};
const DEFAULT_BASE_URLS = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    mock: "",
};
export const DEFAULT_TIMEOUT_MS = 12000;
export function buildConfig(partial = {}) {
    return {
        provider: "mock",
        apiKey: undefined,
        baseUrl: DEFAULT_BASE_URLS.mock,
        models: {},
        timeoutMs: DEFAULT_TIMEOUT_MS,
        dailyBudgetUsd: Number.POSITIVE_INFINITY,
        maxRounds: 3,
        retryBaseDelayMs: 250,
        circuitThreshold: 5,
        circuitOpenMs: 60000,
        ...partial,
    };
}
function parseIntOrUndefined(raw) {
    if (!raw)
        return undefined;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
}
function parseFloatOrUndefined(raw) {
    if (!raw)
        return undefined;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : undefined;
}
export function loadGatewayConfig(env = process.env) {
    const providerRaw = (env.LLM_PROVIDER ?? "openai").toLowerCase();
    const provider = providerRaw === "anthropic" || providerRaw === "mock" ? providerRaw : "openai";
    const models = {};
    if (provider !== "mock") {
        const missing = [];
        for (const tier of TIERS) {
            const envVar = MODEL_ENV_VARS[tier];
            const value = env[envVar];
            if (value) {
                models[tier] = value;
            }
            else {
                missing.push(envVar);
            }
        }
        if (!env.LLM_API_KEY)
            missing.push("LLM_API_KEY");
        if (missing.length > 0) {
            throw new Error(`llm-gateway: configuración incompleta para el proveedor "${provider}". ` +
                `Faltan variables de entorno: ${missing.join(", ")}. ` +
                "Define los modelos por nivel (LLM_MODEL_FAST, LLM_MODEL_SMART, LLM_MODEL_VISION, LLM_MODEL_TRANSCRIBE) y LLM_API_KEY.");
        }
    }
    return {
        provider,
        apiKey: env.LLM_API_KEY || undefined,
        baseUrl: env.LLM_BASE_URL || DEFAULT_BASE_URLS[provider],
        models,
        timeoutMs: parseIntOrUndefined(env.LLM_TIMEOUT_MS) ?? DEFAULT_TIMEOUT_MS,
        dailyBudgetUsd: parseFloatOrUndefined(env.LLM_DAILY_BUDGET_USD) ?? Number.POSITIVE_INFINITY,
        maxRounds: parseIntOrUndefined(env.LLM_MAX_ROUNDS) ?? 3,
        retryBaseDelayMs: 250,
        circuitThreshold: 5,
        circuitOpenMs: 60000,
    };
}
export function createAdapter(cfg) {
    switch (cfg.provider) {
        case "anthropic":
            return new AnthropicAdapter(cfg);
        case "mock":
            return new MockLLMAdapter();
        case "openai":
        default:
            return new OpenAIAdapter(cfg);
    }
}
//# sourceMappingURL=config.js.map