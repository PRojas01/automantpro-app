import { AdapterError } from "../types.js";
function isAbortError(err) {
    return err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
}
function toApiTool(t) {
    return {
        type: "function",
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        },
    };
}
function mapToolCalls(calls) {
    return (calls ?? []).map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
        },
    }));
}
function mapUsage(usage) {
    return {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        cachedTokens: usage?.prompt_tokens_details?.cached_tokens,
    };
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
export class OpenAIAdapter {
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
        return this.cfg.baseUrl || "https://api.openai.com/v1";
    }
    formatMessages(params) {
        const hasImage = params.media?.some((m) => m.kind === "image");
        return params.messages.map((m) => {
            const base = { role: m.role, content: m.content };
            if (m.role === "assistant" && m.tool_calls?.length) {
                base.tool_calls = m.tool_calls.map((tc) => ({
                    id: tc.id,
                    type: tc.type,
                    function: { name: tc.function.name, arguments: tc.function.arguments },
                }));
            }
            if (m.role === "tool" && m.tool_call_id) {
                base.tool_call_id = m.tool_call_id;
            }
            if (hasImage && m.role === "user") {
                const parts = [{ type: "text", text: m.content }];
                for (const media of params.media ?? []) {
                    if (media.kind === "image" && media.dataUrl) {
                        parts.push({ type: "image_url", image_url: { url: media.dataUrl } });
                    }
                }
                base.content = parts;
            }
            return base;
        });
    }
    async transcribe(params, model) {
        const media = params.media?.find((m) => m.kind === "audio");
        if (!media?.dataUrl) {
            throw new AdapterError("Transcripción requiere media de audio (dataUrl).", "other");
        }
        const { fileFromDataUrl } = await import("./media.js");
        const file = fileFromDataUrl(media.dataUrl, media.mime);
        const form = new FormData();
        form.append("file", file);
        form.append("model", model);
        const signal = AbortSignal.timeout(this.cfg.timeoutMs);
        let res;
        try {
            res = await fetch(`${this.baseUrl()}/audio/transcriptions`, {
                method: "POST",
                headers: { Authorization: `Bearer ${this.cfg.apiKey}` },
                body: form,
                signal,
            });
        }
        catch (err) {
            if (isAbortError(err) || signal.aborted) {
                throw new AdapterError(`LLM timeout (${this.cfg.timeoutMs}ms) en transcripción`, "timeout");
            }
            throw new AdapterError(`Fallo de red hacia el proveedor: ${message(err)}`, "network");
        }
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw classifyHttpError(res.status, text);
        }
        const data = (await res.json());
        return { content: data.text ?? null };
    }
    async complete(params) {
        const model = this.resolveModel(params.tier);
        if (!this.cfg.apiKey) {
            throw new AdapterError("LLM_API_KEY requerida para el proveedor OpenAI.", "auth");
        }
        if (params.tier === "transcribe" && params.media?.some((m) => m.kind === "audio")) {
            return this.transcribe(params, model);
        }
        const body = {
            model,
            messages: this.formatMessages(params),
            ...(params.tools?.length ? { tools: params.tools.map(toApiTool) } : {}),
            ...(params.schema ? { response_format: { type: "json_object" } } : {}),
        };
        const signal = AbortSignal.timeout(this.cfg.timeoutMs);
        let res;
        try {
            res = await fetch(`${this.baseUrl()}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.cfg.apiKey}`,
                },
                body: JSON.stringify(body),
                signal,
            });
        }
        catch (err) {
            if (isAbortError(err) || signal.aborted) {
                throw new AdapterError(`LLM timeout (${this.cfg.timeoutMs}ms)`, "timeout");
            }
            throw new AdapterError(`Fallo de red hacia el proveedor: ${message(err)}`, "network");
        }
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw classifyHttpError(res.status, text);
        }
        const data = (await res.json());
        const choice = data.choices?.[0];
        if (!choice) {
            throw new AdapterError("Respuesta sin choices del proveedor.", "other");
        }
        return {
            content: choice.message?.content ?? null,
            tool_calls: choice.message?.tool_calls?.length ? mapToolCalls(choice.message.tool_calls) : undefined,
            usage: mapUsage(data.usage),
        };
    }
}
function message(err) {
    return err instanceof Error ? err.message : String(err);
}
//# sourceMappingURL=openai.js.map