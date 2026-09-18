const SELECT = "SELECT u.id, u.email, u.name, u.staffRole, u.deletedAt, u.createdAt, t.userId AS totpUserId " +
    "FROM `User` u LEFT JOIN `AdminTotp` t ON t.userId = u.id WHERE u.role = 'admin'";
function toMember(row) {
    return {
        id: String(row.id),
        email: String(row.email),
        name: String(row.name ?? ""),
        staffRole: row.staffRole ? String(row.staffRole) : null,
        active: row.deletedAt === null || row.deletedAt === undefined,
        hasTotp: !!row.totpUserId,
        createdAt: row.createdAt,
    };
}
function list(result) {
    const [rows] = result;
    return Array.isArray(rows) ? rows : [];
}
export class MysqlStaffStore {
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
    list() {
        return this.run(async (conn) => list(await conn.query(`${SELECT} ORDER BY u.deletedAt IS NOT NULL, u.createdAt ASC LIMIT 200`)).map(toMember));
    }
    find(id) {
        return this.run(async (conn) => {
            const row = list(await conn.query(`${SELECT} AND u.id = ? LIMIT 1`, [id]))[0];
            return row ? toMember(row) : null;
        });
    }
    emailTaken(email) {
        return this.run(async (conn) => {
            const row = list(await conn.query("SELECT id FROM `User` WHERE email = ? LIMIT 1", [email.toLowerCase()]))[0];
            return !!row;
        });
    }
    create(input) {
        return this.run(async (conn) => {
            const created = list(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            await conn.query("INSERT INTO `User` (id, email, phone, passwordHash, role, staffRole, name, locale, createdAt, updatedAt) " +
                "VALUES (?, ?, ?, ?, 'admin', ?, ?, 'es', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, input.email.toLowerCase(), input.phone, input.passwordHash, input.staffRole, input.name]);
            return id;
        });
    }
    setTotp(id, secret) {
        return this.run(async (conn) => {
            await conn.query("INSERT INTO `AdminTotp` (userId, secret, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)) " +
                "ON DUPLICATE KEY UPDATE secret = VALUES(secret), updatedAt = CURRENT_TIMESTAMP(3)", [id, secret]);
        });
    }
    setRole(id, staffRole) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `User` SET staffRole = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND role = 'admin'", [staffRole, id]);
        });
    }
    setActive(id, active) {
        return this.run(async (conn) => {
            await conn.query(active
                ? "UPDATE `User` SET deletedAt = NULL, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND role = 'admin'"
                : "UPDATE `User` SET deletedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND role = 'admin'", [id]);
        });
    }
    countActiveAdmins() {
        return this.run(async (conn) => {
            const row = list(await conn.query("SELECT COUNT(*) AS n FROM `User` u WHERE u.role = 'admin' AND u.deletedAt IS NULL " +
                "AND (u.staffRole IS NULL OR u.staffRole = 'admin')"))[0];
            return Number(row?.n ?? 0);
        });
    }
}
//# sourceMappingURL=staff-store.js.map