function rows(result) {
    const [list] = result;
    return Array.isArray(list) ? list : [];
}
const text = (value) => (value === null || value === undefined ? null : String(value));
const SELECT = "SELECT r.*, u.name AS fromName FROM `Rating` r LEFT JOIN `User` u ON u.id = r.fromId";
function toRow(row) {
    return {
        id: String(row.id),
        fromId: String(row.fromId),
        fromName: text(row.fromName),
        toId: String(row.toId),
        score: Number(row.score ?? 0),
        comment: text(row.comment),
        kind: text(row.kind),
        workOrderId: text(row.workOrderId),
        hiddenAt: row.hiddenAt ?? null,
        hiddenReason: text(row.hiddenReason),
        createdAt: row.createdAt,
    };
}
export class MysqlRatingStore {
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
    /** Recalcula promedio y cantidad de quien recibe, sobre las reseñas visibles. */
    async refresh(conn, toId) {
        for (const tabla of ["Shop", "Store"]) {
            await conn
                .query(`UPDATE \`${tabla}\` t SET t.ratingAvg = COALESCE((SELECT ROUND(AVG(r.score), 1) FROM \`Rating\` r WHERE r.toId = ? AND r.hiddenAt IS NULL), 0), ` +
                "t.ratingCount = (SELECT COUNT(*) FROM `Rating` r WHERE r.toId = ? AND r.hiddenAt IS NULL) WHERE t.userId = ?", [toId, toId, toId])
                .catch(() => undefined);
        }
    }
    add(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            await conn.query("INSERT INTO `Rating` (id, fromId, toId, score, comment, kind, workOrderId, quoteRequestId, createdAt) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))", [id, input.fromId, input.toId, input.score, input.comment, input.kind, input.workOrderId, input.quoteRequestId]);
            await this.refresh(conn, input.toId);
            return id;
        });
    }
    forUser(userId, limit = 20) {
        const cap = Math.min(Math.max(1, Math.floor(limit)), 100);
        return this.run(async (conn) => rows(await conn.query(`${SELECT} WHERE r.toId = ? ORDER BY r.createdAt DESC LIMIT ${cap}`, [userId])).map(toRow));
    }
    forWorkOrder(workOrderId) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT} WHERE r.workOrderId = ? ORDER BY r.createdAt DESC LIMIT 1`, [workOrderId]))[0];
            return row ? toRow(row) : null;
        });
    }
    get(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT} WHERE r.id = ? LIMIT 1`, [id]))[0];
            return row ? toRow(row) : null;
        });
    }
    hide(id, reason, hiddenBy) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT toId FROM `Rating` WHERE id = ? LIMIT 1", [id]))[0];
            if (!row)
                return false;
            const [result] = await conn.query("UPDATE `Rating` SET hiddenAt = CURRENT_TIMESTAMP(3), hiddenBy = ?, hiddenReason = ? WHERE id = ? AND hiddenAt IS NULL", [hiddenBy, reason, id]);
            const changed = Number(result.affectedRows ?? 0) > 0;
            if (changed)
                await this.refresh(conn, String(row.toId));
            return changed;
        });
    }
    show(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT toId FROM `Rating` WHERE id = ? LIMIT 1", [id]))[0];
            if (!row)
                return false;
            const [result] = await conn.query("UPDATE `Rating` SET hiddenAt = NULL, hiddenBy = NULL, hiddenReason = NULL WHERE id = ? AND hiddenAt IS NOT NULL", [id]);
            const changed = Number(result.affectedRows ?? 0) > 0;
            if (changed)
                await this.refresh(conn, String(row.toId));
            return changed;
        });
    }
}
//# sourceMappingURL=rating-store.js.map