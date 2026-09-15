import { AdapterError, buildConfig, createAdapter } from "@automantpro/agent";
import { ecDayRange } from "../appointments/messages.js";
import { COPILOT_PROMPT_VERSION, COPILOT_SYSTEM_PROMPT, applyName, buildContactSheet, buildUserMessage, parseDraft } from "./prompt.js";
// Servicio del copiloto sobre la pasarela neutral de packages/agent: el proveedor y el modelo se
// eligen con variables de entorno (docs/31 §9). Aplica interruptor, tope diario y registro de costo.
export const AI_ENABLED_KEY = "ai.enabled";
export const AI_BUDGET_KEY = "ai.dailyBudgetUsd";
export const DEFAULT_DAILY_BUDGET_USD = 1;
/** Precios por millón de tokens si no se configuran: altos a propósito para que el tope no se quede corto. */
const DEFAULT_PRICE_INPUT = 15;
const DEFAULT_PRICE_OUTPUT = 75;
const DEFAULT_TIMEOUT_MS = 20_000;
const BASE_URLS = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    mock: "",
};
function positive(raw) {
    const n = Number.parseFloat(raw ?? "");
    return Number.isFinite(n) && n > 0 ? n : undefined;
}
export function readCopilotEnv(env) {
    const raw = (env.LLM_PROVIDER ?? "").trim().toLowerCase();
    const provider = raw === "openai" || raw === "anthropic" || raw === "mock" ? raw : null;
    const model = env.LLM_MODEL_SMART?.trim() || env.LLM_MODEL_FAST?.trim() || null;
    const apiKey = env.LLM_API_KEY?.trim() || undefined;
    const missing = [];
    if (!provider)
        missing.push("LLM_PROVIDER");
    if (provider && provider !== "mock") {
        if (!apiKey)
            missing.push("LLM_API_KEY");
        if (!model)
            missing.push("LLM_MODEL_SMART");
    }
    const priceInput = positive(env.LLM_PRICE_INPUT_PER_MTOK);
    const priceOutput = positive(env.LLM_PRICE_OUTPUT_PER_MTOK);
    const timeout = Number.parseInt(env.LLM_TIMEOUT_MS ?? "", 10);
    const config = missing.length === 0 && provider
        ? buildConfig({
            provider,
            apiKey,
            baseUrl: env.LLM_BASE_URL?.trim() || BASE_URLS[provider],
            models: model ? { fast: model, smart: model } : {},
            timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
        })
        : null;
    return {
        provider,
        model,
        missing,
        priceInput: priceInput ?? DEFAULT_PRICE_INPUT,
        priceOutput: priceOutput ?? DEFAULT_PRICE_OUTPUT,
        pricesDefaulted: priceInput === undefined || priceOutput === undefined,
        config,
    };
}
export function estimateCost(inputTokens, outputTokens, env) {
    return Math.round(((inputTokens * env.priceInput + outputTokens * env.priceOutput) / 1_000_000) * 1_000_000) / 1_000_000;
}
const ERROR_TEXT = {
    auth: "El proveedor de IA rechazó la clave: revisa LLM_API_KEY.",
    rate_limited: "El proveedor de IA está limitando las solicitudes. Intenta en un momento.",
    timeout: "El proveedor de IA tardó demasiado. Intenta de nuevo.",
    network: "No se pudo conectar con el proveedor de IA.",
    server_error: "El proveedor de IA tuvo un error. Intenta de nuevo.",
    other: "El proveedor de IA devolvió un error. Revisa el modelo configurado.",
};
export class CopilotService {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    env() {
        return readCopilotEnv(this.deps.env ?? process.env);
    }
    async enabled() {
        try {
            return (await this.deps.settings.get(AI_ENABLED_KEY)) !== "0";
        }
        catch {
            return true;
        }
    }
    async budget() {
        try {
            const n = Number.parseFloat((await this.deps.settings.get(AI_BUDGET_KEY)) ?? "");
            return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DAILY_BUDGET_USD;
        }
        catch {
            return DEFAULT_DAILY_BUDGET_USD;
        }
    }
    async spentToday() {
        const { start, end } = ecDayRange((this.deps.now ?? (() => new Date()))());
        try {
            return await this.deps.store.spentBetween(start, end);
        }
        catch {
            return null;
        }
    }
    async status() {
        const env = this.env();
        const [enabled, budgetUsd, spentTodayUsd] = await Promise.all([this.enabled(), this.budget(), this.spentToday()]);
        let feedback = null;
        try {
            feedback = await this.deps.store.feedbackSummary(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        }
        catch {
            feedback = null;
        }
        let reason = null;
        if (env.missing.length > 0)
            reason = `Faltan variables de entorno: ${env.missing.join(", ")}.`;
        else if (!enabled)
            reason = "La IA está apagada en Ajustes.";
        else if (spentTodayUsd === null)
            reason = "No se pudo consultar el gasto de hoy.";
        else if (spentTodayUsd >= budgetUsd)
            reason = `Se alcanzó el tope diario de US$ ${budgetUsd.toFixed(2)}.`;
        return {
            provider: env.provider,
            model: env.model,
            missing: env.missing,
            pricesDefaulted: env.pricesDefaulted,
            enabled,
            budgetUsd,
            spentTodayUsd,
            feedback,
            available: reason === null,
            reason,
        };
    }
    async setEnabled(enabled, updatedBy) {
        await this.deps.settings.set(AI_ENABLED_KEY, enabled ? "1" : "0", updatedBy);
    }
    async setBudget(amount, updatedBy) {
        await this.deps.settings.set(AI_BUDGET_KEY, String(amount), updatedBy);
    }
    async draft(input) {
        const env = this.env();
        if (!env.config)
            return { ok: false, reason: "not_configured", message: `La IA no está configurada. Faltan: ${env.missing.join(", ")}.`, usageId: null };
        if (!(await this.enabled()))
            return { ok: false, reason: "disabled", message: "La IA está apagada en Ajustes.", usageId: null };
        const budgetUsd = await this.budget();
        const spent = await this.spentToday();
        if (spent === null)
            return { ok: false, reason: "error", message: "No se pudo verificar el gasto de hoy; la IA queda en pausa.", usageId: null };
        if (spent >= budgetUsd) {
            return { ok: false, reason: "budget", message: `Se alcanzó el tope diario de IA (US$ ${budgetUsd.toFixed(2)}). Usa el mensaje sugerido.`, usageId: null };
        }
        const adapter = (this.deps.adapterFactory ?? createAdapter)(env.config);
        const started = Date.now();
        const model = env.model ?? env.provider ?? "desconocido";
        try {
            const completion = await adapter.complete({
                agent: "redactor",
                tier: "smart",
                messages: [
                    { role: "system", content: COPILOT_SYSTEM_PROMPT },
                    { role: "user", content: buildUserMessage(buildContactSheet(input.ctx), input.customerText, input.instruction) },
                ],
            });
            const inputTokens = completion.usage?.inputTokens ?? 0;
            const outputTokens = completion.usage?.outputTokens ?? 0;
            const costUsd = estimateCost(inputTokens, outputTokens, env);
            if (!completion.content?.trim()) {
                const usageId = await this.record(env, model, inputTokens, outputTokens, completion.usage?.cachedTokens ?? 0, costUsd, Date.now() - started, "fallback");
                return { ok: false, reason: "error", message: "La IA no devolvió texto. Usa el mensaje sugerido.", usageId };
            }
            const usageId = await this.record(env, model, inputTokens, outputTokens, completion.usage?.cachedTokens ?? 0, costUsd, Date.now() - started, "ok");
            const parsed = parseDraft(completion.content);
            return { ok: true, reply: applyName(parsed.reply, input.firstName), note: parsed.note, usageId, costUsd };
        }
        catch (err) {
            const kind = err instanceof AdapterError ? err.kind : "other";
            const usageId = await this.record(env, model, 0, 0, 0, 0, Date.now() - started, "error");
            return { ok: false, reason: "error", message: ERROR_TEXT[kind] ?? ERROR_TEXT.other ?? "Error de la IA.", usageId };
        }
    }
    async record(env, model, inputTokens, outputTokens, cachedTokens, costUsd, latencyMs, outcome) {
        try {
            return await this.deps.store.recordUsage({
                provider: env.provider ?? "desconocido",
                model,
                promptVersion: COPILOT_PROMPT_VERSION,
                inputTokens,
                outputTokens,
                cachedTokens,
                costUsd,
                latencyMs,
                outcome,
            });
        }
        catch {
            return null;
        }
    }
    async feedback(input) {
        await this.deps.store.saveFeedback(input);
    }
}
//# sourceMappingURL=service.js.map