import { AdapterError } from "./types.js";
import { buildConfig } from "./config.js";
import { buildFallbackResponse } from "./fallback.js";
import { redactPii, redactJsonArgs } from "./redact.js";
import { isToolAllowedForAgent } from "./authorization.js";
const INPUT_USD_PER_M = 2;
const OUTPUT_USD_PER_M = 6;
const REPAIR_INSTRUCTION = "Tu respuesta anterior no fue un JSON válido para el esquema esperado. Corrige y devuelve únicamente el JSON válido que cumpla el esquema, sin texto adicional.";
export class ProviderCircuitBreaker {
    threshold;
    openMs;
    now;
    consecutiveFailures = 0;
    openedAtMs = null;
    constructor(threshold = 5, openMs = 60000, now = Date.now) {
        this.threshold = threshold;
        this.openMs = openMs;
        this.now = now;
    }
    isOpen() {
        if (this.openedAtMs === null)
            return false;
        if (this.now() - this.openedAtMs >= this.openMs) {
            this.openedAtMs = null;
            this.consecutiveFailures = 0;
            return false;
        }
        return true;
    }
    recordSuccess() {
        this.consecutiveFailures = 0;
        this.openedAtMs = null;
    }
    recordFailure() {
        this.consecutiveFailures += 1;
        if (this.consecutiveFailures >= this.threshold) {
            this.openedAtMs = this.now();
        }
    }
}
function estimateCost(usage) {
    if (usage?.costUsd != null && Number.isFinite(usage.costUsd))
        return usage.costUsd;
    const input = usage?.inputTokens ?? 0;
    const output = usage?.outputTokens ?? 0;
    return (input * INPUT_USD_PER_M + output * OUTPUT_USD_PER_M) / 1_000_000;
}
function parseToolArgs(raw) {
    try {
        const parsed = JSON.parse(raw || "{}");
        return parsed && typeof parsed === "object" ? parsed : { _raw: raw };
    }
    catch {
        return { _raw: raw };
    }
}
export class CallCycle {
    deps;
    config;
    delay;
    circuit;
    provider;
    model;
    constructor(deps) {
        this.deps = deps;
        this.config = deps.config ?? buildConfig();
        this.delay = deps.delay ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
        this.circuit = deps.circuitBreaker ?? new ProviderCircuitBreaker(this.config.circuitThreshold, this.config.circuitOpenMs, deps.now);
        this.provider = this.config.provider;
        this.model = this.config.models[this.config.provider === "mock" ? "fast" : "fast"] ?? null;
    }
    get circuitBreaker() {
        return this.circuit;
    }
    async buildMessages(params) {
        const prompt = await this.deps.promptStore.getPrompt(params.agent);
        const sections = [prompt];
        if (params.contextSheet)
            sections.push(`Ficha de contexto:\n${params.contextSheet}`);
        if (params.summary)
            sections.push(`Resumen de la conversación:\n${params.summary}`);
        if (params.schema) {
            sections.push("Devuelve únicamente un JSON válido que cumpla el esquema solicitado, sin texto adicional.");
        }
        const systemContent = sections.join("\n\n");
        const messages = [{ role: "system", content: systemContent }];
        for (const turn of params.turns ?? []) {
            const content = turn.role === "user" ? redactPii(turn.content) : turn.content;
            messages.push({ role: turn.role, content, tool_call_id: turn.tool_call_id });
        }
        if (params.userMessage) {
            messages.push({ role: "user", content: redactPii(params.userMessage) });
        }
        return messages;
    }
    toGatewayParams(params, messages) {
        return {
            agent: params.agent,
            tier: params.tier,
            messages,
            tools: params.tools,
            schema: params.schema,
        };
    }
    usageRecord(params, completion, latencyMs, outcome) {
        const usage = completion?.usage;
        return {
            agent: params.agent,
            tier: params.tier,
            conversationId: params.conversationId,
            functionLabel: params.functionLabel,
            provider: this.provider,
            model: this.model,
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            cachedTokens: usage?.cachedTokens ?? 0,
            costUsd: usage ? estimateCost(usage) : 0,
            latencyMs,
            outcome,
        };
    }
    async recordToolCall(params, tool, args, resultStatus, durationMs, error) {
        if (!this.deps.toolCallStore)
            return;
        await this.deps.toolCallStore.recordToolCall({
            conversationId: params.conversationId,
            agent: params.agent,
            tool,
            argsJson: redactJsonArgs(args),
            resultStatus,
            durationMs,
            confirmedByUser: resultStatus !== "confirmation",
            error,
        });
    }
    async callWithRetry(params) {
        for (let attempt = 0;; attempt++) {
            try {
                const completion = await this.deps.adapter.complete(params);
                this.circuit.recordSuccess();
                return completion;
            }
            catch (err) {
                const kind = err instanceof AdapterError ? err.kind : "other";
                const retryable = kind === "rate_limited" || kind === "server_error";
                this.circuit.recordFailure();
                if (retryable && attempt === 0) {
                    await this.delay(this.config.retryBaseDelayMs * (attempt + 1));
                    continue;
                }
                throw err;
            }
        }
    }
    validateAgainstSchema(content, schema) {
        if (!content)
            return { valid: false };
        try {
            const value = JSON.parse(content);
            const result = schema.safeParse(value);
            if (result.success)
                return { valid: true, value: result.data };
            return { valid: false };
        }
        catch {
            return { valid: false };
        }
    }
    async performCall(params, messages) {
        const usages = [];
        const startedAt = Date.now();
        let completion;
        try {
            completion = await this.callWithRetry(this.toGatewayParams(params, messages));
        }
        catch (err) {
            const outcome = "error";
            usages.push(this.usageRecord(params, null, Date.now() - startedAt, outcome));
            if (this.deps.usageStore)
                await this.deps.usageStore.recordUsage(usages[usages.length - 1]);
            return { kind: "error", usages };
        }
        usages.push(this.usageRecord(params, completion, Date.now() - startedAt, "ok"));
        if (params.schema) {
            const attempt = this.validateAgainstSchema(completion.content, params.schema);
            if (!attempt.valid) {
                const repairStartedAt = Date.now();
                const repairMessages = [...messages, { role: "user", content: REPAIR_INSTRUCTION }];
                try {
                    const repairCompletion = await this.callWithRetry(this.toGatewayParams(params, repairMessages));
                    usages.push(this.usageRecord(params, repairCompletion, Date.now() - repairStartedAt, "ok"));
                    const repaired = this.validateAgainstSchema(repairCompletion.content, params.schema);
                    if (repaired.valid) {
                        if (this.deps.usageStore)
                            for (const u of usages)
                                await this.deps.usageStore.recordUsage(u);
                        return { kind: "ok", completion: repairCompletion, parsed: repaired.value, hasParsed: true, usages };
                    }
                }
                catch {
                    usages.push(this.usageRecord(params, null, Date.now() - repairStartedAt, "fallback"));
                }
                if (this.deps.usageStore)
                    for (const u of usages)
                        await this.deps.usageStore.recordUsage(u);
                return { kind: "validation_failed", usages };
            }
        }
        if (this.deps.usageStore)
            for (const u of usages)
                await this.deps.usageStore.recordUsage(u);
        return { kind: "ok", completion, hasParsed: false, usages };
    }
    async processToolCalls(calls, params, defs) {
        const outcomes = [];
        const pendingConfirmation = [];
        const results = [];
        for (const tc of calls) {
            const name = tc.function.name;
            const args = parseToolArgs(tc.function.arguments);
            const definition = defs.get(name);
            if (!isToolAllowedForAgent(params.agent, name)) {
                outcomes.push({
                    id: tc.id,
                    name,
                    status: "rejected",
                    arguments: args,
                    error: `Función '${name}' no autorizada para este perfil.`,
                });
                await this.recordToolCall(params, name, args, "rejected", 0);
                continue;
            }
            if (definition?.requiresConfirmation) {
                outcomes.push({ id: tc.id, name, status: "confirmation", arguments: args });
                pendingConfirmation.push({ id: tc.id, name, arguments: args });
                await this.recordToolCall(params, name, args, "confirmation", 0);
                continue;
            }
            const startedAt = Date.now();
            const result = await this.deps.executor.execute({ id: tc.id, name, arguments: args }, params.agent);
            const durationMs = Date.now() - startedAt;
            const status = result.success ? "executed" : "error";
            outcomes.push({
                id: tc.id,
                name,
                status,
                arguments: args,
                result: result.data,
                error: result.error,
            });
            await this.recordToolCall(params, name, args, status, durationMs, result.error);
            results.push({
                id: tc.id,
                serialized: JSON.stringify({
                    name,
                    success: result.success,
                    data: result.data,
                    error: result.error ?? null,
                }),
            });
        }
        return { outcomes, pendingConfirmation, results };
    }
    async run(params) {
        const emptyResult = (outcome, fallbackReason) => ({
            outcome,
            content: buildFallbackResponse(fallbackReason),
            toolCallOutcomes: [],
            pendingConfirmation: [],
            usage: [],
            fallbackReason,
        });
        if (this.deps.quota) {
            const decision = await this.deps.quota.check(params.agent);
            if (!decision.allowed)
                return emptyResult("fallback", "quota");
        }
        if (this.deps.usageStore &&
            Number.isFinite(this.config.dailyBudgetUsd) &&
            (await this.deps.usageStore.getDailySpendUsd()) >= this.config.dailyBudgetUsd) {
            return emptyResult("fallback", "budget");
        }
        if (this.circuit.isOpen())
            return emptyResult("fallback", "circuit_open");
        const messages = await this.buildMessages(params);
        const defs = new Map((params.tools ?? []).map((t) => [t.name, t]));
        const usages = [];
        const toolCallOutcomes = [];
        const pendingConfirmation = [];
        const roundLimit = params.maxExecutionRounds ?? this.config.maxRounds;
        let executionRounds = 0;
        let content = null;
        let parsed;
        let hasParsed = false;
        while (true) {
            const attempt = await this.performCall(params, messages);
            usages.push(...attempt.usages);
            if (attempt.kind === "error") {
                return { outcome: "error", content: null, toolCallOutcomes, pendingConfirmation, usage: usages };
            }
            if (attempt.kind === "validation_failed") {
                return {
                    outcome: "fallback",
                    content: buildFallbackResponse("validation"),
                    toolCallOutcomes,
                    pendingConfirmation,
                    usage: usages,
                    fallbackReason: "validation",
                };
            }
            if (attempt.hasParsed) {
                parsed = attempt.parsed;
                hasParsed = true;
            }
            content = attempt.completion.content;
            if (attempt.completion.tool_calls?.length) {
                executionRounds += 1;
                if (executionRounds > roundLimit)
                    break;
                const round = await this.processToolCalls(attempt.completion.tool_calls, params, defs);
                toolCallOutcomes.push(...round.outcomes);
                pendingConfirmation.push(...round.pendingConfirmation);
                if (round.pendingConfirmation.length > 0) {
                    const first = round.pendingConfirmation[0];
                    content =
                        content ??
                            `Antes de continuar: ¿confirmas la acción "${first.name}"? La ejecución requiere la confirmación del usuario.`;
                    break;
                }
                messages.push({
                    role: "assistant",
                    content: attempt.completion.content ?? "",
                    tool_calls: attempt.completion.tool_calls,
                });
                for (const r of round.results) {
                    messages.push({ role: "tool", content: r.serialized, tool_call_id: r.id });
                }
                continue;
            }
            break;
        }
        return {
            outcome: "ok",
            content,
            parsed: hasParsed ? parsed : undefined,
            toolCallOutcomes,
            pendingConfirmation,
            usage: usages,
        };
    }
}
//# sourceMappingURL=call-cycle.js.map