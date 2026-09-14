import type { ZodType } from "zod";
import type { LLMMessage, LLMToolCall, ToolDefinition } from "../types.js";
export type AgentName = "owner" | "workshop" | "store" | "admin" | "nlu" | "diagnoser" | "redactor" | "vision" | "transcriber" | "importer";
export type ModelTier = "fast" | "smart" | "vision" | "transcribe";
export type CallOutcome = "ok" | "fallback" | "error";
export type FallbackReason = "quota" | "budget" | "validation" | "circuit_open";
export type ErrorKind = "timeout" | "rate_limited" | "server_error" | "auth" | "network" | "other";
export type ToolResultStatus = "executed" | "error" | "rejected" | "confirmation";
export interface MediaItem {
    kind: "image" | "audio";
    mime?: string;
    dataUrl?: string;
}
export interface GatewayParams {
    agent: AgentName;
    tier: ModelTier;
    messages: LLMMessage[];
    tools?: ToolDefinition[];
    schema?: ZodType<unknown>;
    media?: MediaItem[];
}
export interface UsageInfo {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    costUsd?: number;
}
export interface GatewayCompletion {
    content: string | null;
    tool_calls?: LLMToolCall[];
    usage?: UsageInfo;
}
export interface LLMAdapter {
    complete(params: GatewayParams): Promise<GatewayCompletion>;
}
export declare class AdapterError extends Error {
    readonly kind: ErrorKind;
    readonly status?: number;
    constructor(message: string, kind: ErrorKind, status?: number);
}
export interface LlmUsageRecord {
    agent: AgentName;
    tier: ModelTier;
    conversationId?: string;
    functionLabel?: string;
    provider: string;
    model: string | null;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    costUsd: number;
    latencyMs: number;
    outcome: CallOutcome;
}
export interface ToolCallRecord {
    conversationId?: string;
    agent: AgentName;
    tool: string;
    argsJson: string;
    resultStatus: ToolResultStatus;
    durationMs: number;
    confirmedByUser: boolean;
    error?: string;
}
export interface ToolCallOutcome {
    id: string;
    name: string;
    status: ToolResultStatus;
    arguments: Record<string, unknown>;
    result?: unknown;
    error?: string;
}
export interface PendingToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface CycleRunParams {
    agent: AgentName;
    tier: ModelTier;
    conversationId?: string;
    functionLabel?: string;
    contextSheet?: string;
    summary?: string;
    turns?: LLMMessage[];
    userMessage?: string;
    tools?: ToolDefinition[];
    schema?: ZodType<unknown>;
    timeoutMs?: number;
    maxExecutionRounds?: number;
}
export interface CycleResult {
    outcome: CallOutcome;
    content: string | null;
    parsed?: unknown;
    toolCallOutcomes: ToolCallOutcome[];
    pendingConfirmation: PendingToolCall[];
    usage: LlmUsageRecord[];
    fallbackReason?: FallbackReason;
}
export interface CircuitBreaker {
    isOpen(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
}
//# sourceMappingURL=types.d.ts.map