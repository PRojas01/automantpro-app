import { prisma } from "./prisma.js";
export const RECENT_TURNS_DEFAULT = 6;
export const SUMMARY_TURNS_INTERVAL = 10;
export class ConversationStore {
    adapter;
    summaryGenerator;
    recentTurnsLimit;
    summaryEveryTurns;
    constructor(options = {}) {
        this.adapter = options.adapter ?? new PrismaConversationAdapter();
        this.summaryGenerator = options.summaryGenerator;
        this.recentTurnsLimit = options.recentTurns ?? RECENT_TURNS_DEFAULT;
        this.summaryEveryTurns = options.summaryEveryTurns ?? SUMMARY_TURNS_INTERVAL;
    }
    getSession(userId, role) {
        return this.adapter.getSession(userId, role);
    }
    saveSession(session) {
        return this.adapter.saveSession(session);
    }
    async ensureConversation(input) {
        return this.adapter.ensureConversation(input);
    }
    async appendMessage(input) {
        const message = await this.adapter.appendMessage(input);
        const turnCount = await this.adapter.countMessages(input.conversationId);
        const due = this.summaryEveryTurns > 0 && turnCount > 0 && turnCount % this.summaryEveryTurns === 0;
        if (due && this.summaryGenerator) {
            // El resumen lo genera el agente vía función inyectada; un fallo no rompe el mensaje.
            try {
                const last = await this.adapter.recentTurns(input.conversationId, this.recentTurnsLimit);
                const summary = await this.summaryGenerator({
                    conversationId: input.conversationId,
                    userId: last[last.length - 1]?.from ?? "",
                    turnCount,
                    recentTurns: last,
                });
                await this.adapter.saveSummary(input.conversationId, summary);
            }
            catch {
                // no fatal: el mensaje ya quedó persistido
            }
        }
        return message;
    }
    getRecentTurns(conversationId) {
        return this.adapter.recentTurns(conversationId, this.recentTurnsLimit);
    }
    getSummary(conversationId) {
        return this.adapter.getSummary(conversationId);
    }
    saveSummary(conversationId, summary) {
        return this.adapter.saveSummary(conversationId, summary);
    }
}
/**
 * Adaptador por defecto: persiste en MySQL a través del cliente Prisma (carga diferida,
 * véase infrastructure/prisma.ts). Los resultados se tipan de forma explícita.
 */
class PrismaConversationAdapter {
    async getSession(userId, role) {
        const row = await prisma.session.findFirst({
            where: { userId, role },
            orderBy: { createdAt: "desc" },
        });
        if (!row)
            return null;
        return {
            userId: row.userId,
            role: row.role,
            flow: row.flow,
            step: row.step,
            data: row.data,
            expiresAt: row.expiresAt,
        };
    }
    async saveSession(session) {
        const data = {
            flow: session.flow ?? null,
            step: session.step ?? null,
            data: (session.data ?? null),
            expiresAt: session.expiresAt,
        };
        const existing = await prisma.session.findFirst({
            where: { userId: session.userId, role: session.role },
            orderBy: { createdAt: "desc" },
        });
        const row = existing
            ? await prisma.session.update({ where: { id: existing.id }, data })
            : await prisma.session.create({
                data: { userId: session.userId, role: session.role, ...data },
            });
        return {
            userId: row.userId,
            role: row.role,
            flow: row.flow,
            step: row.step,
            data: row.data,
            expiresAt: row.expiresAt,
        };
    }
    async ensureConversation(input) {
        const agent = input.agent ?? false;
        const existing = await prisma.conversation.findFirst({
            where: { userAId: input.userAId, agent },
            orderBy: { createdAt: "desc" },
        });
        if (existing)
            return existing.id;
        const created = await prisma.conversation.create({
            data: { userAId: input.userAId, agent, turnCount: 0 },
        });
        return created.id;
    }
    async appendMessage(input) {
        const row = await prisma.message.create({
            data: {
                conversationId: input.conversationId,
                wamid: input.wamid ?? null,
                from: input.from,
                direction: input.direction,
                type: input.type,
                body: input.body ?? null,
                payload: (input.payload ?? null),
                costUsd: input.costUsd ?? null,
            },
        });
        await prisma.conversation.update({
            where: { id: input.conversationId },
            data: { turnCount: { increment: 1 } },
        });
        return toMessageRecord(row);
    }
    async countMessages(conversationId) {
        return prisma.message.count({ where: { conversationId } });
    }
    async recentTurns(conversationId, limit) {
        const rows = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        return rows.reverse().map((row) => toMessageRecord(row));
    }
    async getSummary(conversationId) {
        const row = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { summary: true },
        });
        return row?.summary ?? null;
    }
    async saveSummary(conversationId, summary) {
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { summary },
        });
    }
}
function toMessageRecord(row) {
    return row;
}
export function createConversationStore(options = {}) {
    return new ConversationStore(options);
}
//# sourceMappingURL=conversation-store.js.map