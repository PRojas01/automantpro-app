const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 50;
function rows(result) {
    const [list] = result;
    return Array.isArray(list) ? list : [];
}
const text = (value) => (value === null || value === undefined ? null : String(value));
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
            await conn.query("INSERT INTO `Visit` (code, ref, profile, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))", [code, ref, profile]);
            // La bitácora de eventos se mantiene: es la que ya leían el panel y los informes.
            await conn
                .query("INSERT INTO `Event` (id, type, actorUserId, actorRole, entityType, entityId, payload, createdAt) VALUES (UUID(), 'entry.visit', NULL, NULL, 'Visit', ?, ?, CURRENT_TIMESTAMP(3))", [code, JSON.stringify({ ref, perfil: profile })])
                .catch(() => undefined);
        });
    }
    exists(code) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT code FROM `Visit` WHERE code = ? LIMIT 1", [code]))[0];
            return !!row;
        });
    }
    find(code, now = new Date()) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT v.code, v.ref, v.profile, v.phone, v.userId, v.claimedAt, v.linkedAt, v.createdAt, u.name AS userName FROM `Visit` v " +
                "LEFT JOIN `User` u ON u.id = v.userId WHERE v.code = ? AND v.createdAt >= ? LIMIT 1", [code, new Date(now.getTime() - MAX_AGE_MS)]))[0];
            if (!row)
                return null;
            return {
                code: String(row.code),
                ref: text(row.ref),
                profile: text(row.profile),
                phone: text(row.phone),
                userId: text(row.userId),
                userName: text(row.userName),
                claimedAt: row.claimedAt ?? null,
                linkedAt: row.linkedAt ?? null,
                createdAt: row.createdAt,
            };
        });
    }
    claim(code, phone) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `Visit` SET phone = ?, claimedAt = CURRENT_TIMESTAMP(3) WHERE code = ? AND (phone IS NULL OR phone = ?)", [phone, code, phone]);
        });
    }
    link(code, userId) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `Visit` SET userId = ?, linkedAt = CURRENT_TIMESTAMP(3) WHERE code = ? AND userId IS NULL", [userId, code]);
        });
    }
    list(page) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            const items = rows(await conn.query("SELECT v.code, v.ref, v.profile, v.phone, v.userId, v.claimedAt, v.linkedAt, v.createdAt, u.name AS userName FROM `Visit` v " +
                `LEFT JOIN \`User\` u ON u.id = v.userId ORDER BY v.createdAt DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`)).map((row) => ({
                code: String(row.code),
                ref: text(row.ref),
                profile: text(row.profile),
                phone: text(row.phone),
                userId: text(row.userId),
                userName: text(row.userName),
                claimedAt: row.claimedAt ?? null,
                linkedAt: row.linkedAt ?? null,
                createdAt: row.createdAt,
            }));
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    stats(days) {
        const window = Math.max(1, Math.floor(days));
        return this.run(async (conn) => rows(await conn.query("SELECT ref, profile, COUNT(*) AS visitas, SUM(phone IS NOT NULL) AS escribieron, SUM(userId IS NOT NULL) AS registrados " +
            `FROM \`Visit\` WHERE createdAt >= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ${window} DAY) ` +
            "GROUP BY ref, profile ORDER BY visitas DESC LIMIT 50")).map((row) => ({
            ref: text(row.ref),
            profile: text(row.profile),
            visitas: Number(row.visitas ?? 0),
            escribieron: Number(row.escribieron ?? 0),
            registrados: Number(row.registrados ?? 0),
        })));
    }
}
//# sourceMappingURL=visit-store.js.map