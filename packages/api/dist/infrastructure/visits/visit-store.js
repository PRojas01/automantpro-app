const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export class MysqlVisitStore {
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
    record(code, ref, profile = null) {
        return this.run(async (conn) => {
            await conn.query("INSERT INTO `Event` (id, type, actorUserId, actorRole, entityType, entityId, payload, createdAt) VALUES (UUID(), 'entry.visit', NULL, NULL, 'Visit', ?, ?, CURRENT_TIMESTAMP(3))", [code, JSON.stringify({ ref, perfil: profile })]);
        });
    }
    find(code, now = new Date()) {
        return this.run(async (conn) => {
            const [rows] = await conn.query("SELECT payload, createdAt FROM `Event` WHERE type = 'entry.visit' AND entityType = 'Visit' AND entityId = ? AND createdAt >= ? ORDER BY createdAt DESC LIMIT 1", [code, new Date(now.getTime() - MAX_AGE_MS)]);
            const row = Array.isArray(rows) ? rows[0] : undefined;
            if (!row)
                return null;
            let payload = row.payload;
            if (typeof payload === "string") {
                try {
                    payload = JSON.parse(payload);
                }
                catch {
                    payload = null;
                }
            }
            const data = (payload && typeof payload === "object" ? payload : {});
            return {
                code,
                ref: typeof data.ref === "string" ? data.ref : null,
                profile: typeof data.perfil === "string" ? data.perfil : null,
                createdAt: row.createdAt,
            };
        });
    }
}
//# sourceMappingURL=visit-store.js.map