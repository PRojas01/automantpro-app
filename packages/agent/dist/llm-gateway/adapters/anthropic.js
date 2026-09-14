import { AdapterError } from "../types.js";
const ANTHROPIC_VERSION = "2023-06-01";
function toApiTool(t) {
    return {
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
    };
}
function toAssistantMessage(m) {
    if (m.role === "tool") {
        return {
            role: "user",
            content: [
                { type: "tool_result", tool_use_id: m.tool_call_id, content: m.content },
            ],
        };
    }
    if (m.role === "assistant") {
        const blocks = [];
        if (m.content)
            blocks.push({ type: "text", text: m.content });
        for (const tc of m.tool_calls ?? []) {
            blocks.push({ type: "tool_use", id: tc.id, name: tc.function.name, input: parseArgs(tc.function.arguments) });
        }
        return { role: "assistant", content: blocks };
    }
    if (m.role === "user")
        return { role: "user", content: m.content };
    return null;
}
function parseArgs(raw) {
    try {
        return JSON.parse(raw || "{}");
    }
    catch {
        return { _raw: raw };
    }
}
function classifyHttpError(status, text) {
    if (status === 429)
        return new AdapterError(`LLM rate limited (429): ${text}`, "rate_limited", status);
    if (status >= 500)
        return new AdapterError(`LLM server error (${status}): ${text}`, "server_error", status);
    if (status === 401 || status === 403)
        return new AdapterError(`LLM auth error (${status}): ${text}`, "auth", status);
    return new AdapterError(`LLM API error (${status}): ${text}`, "other", status);
}
export class AnthropicAdapter {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    resolveModel(tier) {
        const model = this.cfg.models[tier] ?? this.cfg.models.fast;
        if (!model) {
            throw new AdapterError(`No hay modelo configurado para el nivel "${tier}". Define la variable LLM_MODEL_${tier.toUpperCase()}.`, "other");
        }
        return model;
    }
    baseUrl() {
        return this.cfg.baseUrl || "https://api.anthropic.com";
    }
    async complete(params) {
        const model = this.resolveModel(params.tier);
        if (!this.cfg.apiKey) {
            throw new AdapterError("LLM_API_KEY requerida para el proveedor Anthropic.", "auth");
        }
        const systemMessages = params.messages.filter((m) => m.role === "system");
        const system = systemMessages.map((m) => m.content).join("\n\n");
        const messages = params.messages
            .filter((m) => m.role !== "system")
            .map(toAssistantMessage)
            .filter((m) => m !== null);
        const body = {
            model,
            max_tokens: 1024,
            system,
            messages,
            ...(params.tools?.length ? { tools: params.tools.map(toApiTool) } : {}),
        };
        const signal = AbortSignal.timeout(this.cfg.timeoutMs);
        let res;
        try {
            res = await fetch(`${this.baseUrl()}/v1/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.cfg.apiKey,
                    "anthropic-version": ANTHROPIC_VERSION,
                },
                body: JSON.stringify(body),
                signal,
            });
        }
        catch (err) {
            const aborted = err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
            if (aborted || signal.aborted) {
                throw new AdapterError(`LLM timeout (${this.cfg.timeoutMs}ms)`, "timeout");
            }
            throw new AdapterError(`Fallo de red hacia el proveedor: ${err instanceof Error ? err.message : String(err)}`, "network");
        }
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw classifyHttpError(res.status, text);
        }
        const data = (await res.json());
        const blocks = data.content ?? [];
        const textBlocks = blocks.filter((b) => b.type === "text" && b.text).map((b) => b.text);
        const toolUse = blocks.filter((b) => b.type === "tool_use");
        const tool_calls = toolUse.length
            ? toolUse.map((b) => ({
                id: b.id ?? `call_${Date.now()}`,
                type: "function",
                function: { name: b.name ?? "", arguments: JSON.stringify(b.input ?? {}) },
            }))
            : undefined;
        const usage = {
            inputTokens: data.usage?.input_tokens,
            outputTokens: data.usage?.output_tokens,
        };
        return {
            content: textBlocks.length > 0 ? textBlocks.join("\n") : null,
            tool_calls,
            usage,
        };
    }
}
//# sourceMappingURL=anthropic.js.map