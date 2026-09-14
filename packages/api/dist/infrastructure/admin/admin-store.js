const PAGE_SIZE = 25;
function rows(result) {
    return Array.isArray(result[0]) ? result[0] : [];
}
async function scalar(conn, sql, params = []) {
    const row = rows(await conn.query(sql, params))[0];
    return Number(row?.n ?? 0);
}
function grouped(list) {
    const out = {};
    for (const r of list)
        out[String(r.k)] = Number(r.n ?? 0);
    return out;
}
function offset(page) {
    return (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
}
export class MysqlAdminStore {
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
    findAdminByEmail(email) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT u.id, u.email, u.name, u.passwordHash, t.secret AS totpSecret FROM `User` u LEFT JOIN `AdminTotp` t ON t.userId = u.id WHERE u.email = ? AND u.role = 'admin' AND u.deletedAt IS NULL LIMIT 1", [email.toLowerCase()]))[0];
            if (!row)
                return null;
            return {
                id: String(row.id),
                email: String(row.email),
                name: String(row.name),
                passwordHash: String(row.passwordHash),
                totpSecret: row.totpSecret ? String(row.totpSecret) : null,
            };
        });
    }
    upsertAdmin(input) {
        return this.run(async (conn) => {
            const email = input.email.toLowerCase();
            const existing = rows(await conn.query("SELECT id FROM `User` WHERE email = ? LIMIT 1", [email]))[0];
            let id;
            if (existing) {
                id = String(existing.id);
                await conn.query("UPDATE `User` SET name = ?, passwordHash = ?, role = 'admin', deletedAt = NULL, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [input.name, input.passwordHash, id]);
            }
            else {
                const created = rows(await conn.query("SELECT UUID() AS id"))[0];
                id = String(created?.id);
                await conn.query("INSERT INTO `User` (id, email, phone, passwordHash, role, name, locale, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'admin', ?, 'es', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, email, input.phone, input.passwordHash, input.name]);
            }
            await conn.query("INSERT INTO `AdminTotp` (userId, secret, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE secret = VALUES(secret), updatedAt = CURRENT_TIMESTAMP(3)", [id, input.totpSecret]);
            return id;
        });
    }
    recordAudit(input) {
        return this.run(async (conn) => {
            await conn.query("INSERT INTO `AuditLog` (id, eventType, actorUserId, actorRole, reason, createdAt) VALUES (UUID(), ?, ?, 'admin', ?, CURRENT_TIMESTAMP(3))", [input.eventType, input.actorUserId ?? null, input.reason ?? null]);
        });
    }
    dashboard() {
        return this.run(async (conn) => ({
            usersByRole: grouped(rows(await conn.query("SELECT role AS k, COUNT(*) AS n FROM `User` WHERE deletedAt IS NULL GROUP BY role"))),
            vehicles: await scalar(conn, "SELECT COUNT(*) AS n FROM `Vehicle` WHERE deletedAt IS NULL"),
            shopsByStatus: grouped(rows(await conn.query("SELECT verificationStatus AS k, COUNT(*) AS n FROM `Shop` GROUP BY verificationStatus"))),
            stores: await scalar(conn, "SELECT COUNT(*) AS n FROM `Store`"),
            appointmentsToday: await scalar(conn, "SELECT COUNT(*) AS n FROM `Appointment` WHERE scheduledAt >= CURDATE() AND scheduledAt < CURDATE() + INTERVAL 1 DAY"),
            appointmentsPending: await scalar(conn, "SELECT COUNT(*) AS n FROM `Appointment` WHERE status = 'pending'"),
            conversations: await scalar(conn, "SELECT COUNT(*) AS n FROM `Conversation`"),
            messages24h: await scalar(conn, "SELECT COUNT(*) AS n FROM `Message` WHERE createdAt >= NOW() - INTERVAL 1 DAY"),
        }));
    }
    listUsers(page) {
        return this.run(async (conn) => ({
            items: rows(await conn.query("SELECT id, name, role, locale, createdAt FROM `User` WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT ? OFFSET ?", [PAGE_SIZE, offset(page)])),
            page,
            pageSize: PAGE_SIZE,
        }));
    }
    listVehicles(page) {
        return this.run(async (conn) => ({
            items: rows(await conn.query("SELECT id, make, model, year, currentKm, createdAt FROM `Vehicle` WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT ? OFFSET ?", [PAGE_SIZE, offset(page)])),
            page,
            pageSize: PAGE_SIZE,
        }));
    }
    listShops(page) {
        return this.run(async (conn) => ({
            items: rows(await conn.query("SELECT id, name, city, verificationStatus, ratingAvg, createdAt FROM `Shop` ORDER BY createdAt DESC LIMIT ? OFFSET ?", [PAGE_SIZE, offset(page)])),
            page,
            pageSize: PAGE_SIZE,
        }));
    }
    listAudit(page) {
        return this.run(async (conn) => ({
            items: rows(await conn.query("SELECT eventType, actorUserId, actorRole, reason, createdAt FROM `AuditLog` ORDER BY createdAt DESC LIMIT ? OFFSET ?", [PAGE_SIZE, offset(page)])),
            page,
            pageSize: PAGE_SIZE,
        }));
    }
}
//# sourceMappingURL=admin-store.js.map