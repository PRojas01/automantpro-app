import type { Role } from "@prisma/client";
export type MessageDirection = "incoming" | "outgoing";
export type MessageType = "text" | "audio" | "image" | "button" | "location" | "document" | "video" | "sticker" | "reaction" | "contacts" | "unknown";
export declare const RECENT_TURNS_DEFAULT = 6;
export declare const SUMMARY_TURNS_INTERVAL = 10;
export interface SessionState {
    userId: string;
    role: Role;
    flow?: string | null;
    step?: string | null;
    data?: Record<string, unknown> | null;
    expiresAt: Date;
}
export interface MessageRecord {
    id: string;
    conversationId: string;
    wamid?: string | null;
    from: string;
    direction: MessageDirection;
    type: MessageType;
    body?: string | null;
    payload?: Record<string, unknown> | null;
    costUsd?: number | null;
    createdAt: Date;
}
export interface MessageInput {
    conversationId: string;
    wamid?: string | null;
    from: string;
    direction: MessageDirection;
    type: MessageType;
    body?: string | null;
    payload?: Record<string, unknown> | null;
    costUsd?: number | null;
}
export interface ConversationStoreAdapter {
    getSession(userId: string, role: Role): Promise<SessionState | null>;
    saveSession(session: SessionState): Promise<SessionState>;
    ensureConversation(input: {
        userAId: string;
        agent?: boolean;
    }): Promise<string>;
    appendMessage(input: MessageInput): Promise<MessageRecord>;
    countMessages(conversationId: string): Promise<number>;
    recentTurns(conversationId: string, limit: number): Promise<MessageRecord[]>;
    getSummary(conversationId: string): Promise<string | null>;
    saveSummary(conversationId: string, summary: string): Promise<void>;
}
export interface SummaryContext {
    conversationId: string;
    userId: string;
    turnCount: number;
    recentTurns: MessageRecord[];
}
export type SummaryGenerator = (ctx: SummaryContext) => Promise<string>;
export interface ConversationStoreOptions {
    adapter?: ConversationStoreAdapter;
    summaryGenerator?: SummaryGenerator;
    recentTurns?: number;
    summaryEveryTurns?: number;
}
export declare class ConversationStore {
    private readonly adapter;
    private readonly summaryGenerator?;
    private readonly recentTurnsLimit;
    private readonly summaryEveryTurns;
    constructor(options?: ConversationStoreOptions);
    getSession(userId: string, role: Role): Promise<SessionState | null>;
    saveSession(session: SessionState): Promise<SessionState>;
    ensureConversation(input: {
        userAId: string;
        agent?: boolean;
    }): Promise<string>;
    appendMessage(input: MessageInput): Promise<MessageRecord>;
    getRecentTurns(conversationId: string): Promise<MessageRecord[]>;
    getSummary(conversationId: string): Promise<string | null>;
    saveSummary(conversationId: string, summary: string): Promise<void>;
}
export declare function createConversationStore(options?: ConversationStoreOptions): ConversationStore;
//# sourceMappingURL=conversation-store.d.ts.map