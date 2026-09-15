function rows(result) {
    return Array.isArray(result[0]) ? result[0] : [];
}
export class MysqlCopilotStore {
    connect;
    constructor(connect) {
        this.connect = connect;
    }
    async run(work) {
        const conn = await this.connect();
        try {
            return await work(conn);
        }
        finally {
            await conn.end().catch(() => undefined);
        }
    }
    recordUsage(usage) {
        return this.run(async (conn) => {
            const id = String(rows(await conn.query("SELECT UUID() AS id"))[0]?.id);
            await conn.query("INSERT INTO `LlmUsage` (id, agent, `function`, provider, model, promptVersion, inputTokens, outputTokens, cachedTokens, costUsd, latencyMs, outcome, createdAt) VALUES (?, 'copilot', 'draft_reply', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))", [
                id,
                usage.provider,
                usage.model.slice(0, 191),
                usage.promptVersion,
                usage.inputTokens,
                usage.outputTokens,
                usage.cachedTokens,
                usage.costUsd,
                usage.latencyMs,
                usage.outcome,
            ]);
            return id;
        });
    }
    spentBetween(start, end) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT COALESCE(SUM(costUsd), 0) AS n FROM `LlmUsage` WHERE agent = 'copilot' AND createdAt >= ? AND createdAt < ?", [start, end]))[0];
            return Number(row?.n ?? 0);
        });
    }
    saveFeedback(input) {
        return this.run(async (conn) => {
            await conn.query("INSERT INTO `Feedback` (id, userId, target, score, reason, createdAt) VALUES (UUID(), ?, ?, ?, ?, CURRENT_TIMESTAMP(3))", [input.userId, `copilot:${input.usageId}`, input.good ? 5 : 1, input.reason]);
        });
    }
    feedbackSummary(since) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT COALESCE(SUM(score >= 4), 0) AS good, COALESCE(SUM(score <= 2), 0) AS bad FROM `Feedback` WHERE target LIKE 'copilot:%' AND createdAt >= ?", [since]))[0];
            return { good: Number(row?.good ?? 0), bad: Number(row?.bad ?? 0) };
        });
    }
}
//# sourceMappingURL=copilot-store.js.map