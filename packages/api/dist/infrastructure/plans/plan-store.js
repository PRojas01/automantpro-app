import { effectivePlan } from "../../application/plans/plans.js";
const PAGE_SIZE = 25;
function rows(result) {
    const [list] = result;
    return Array.isArray(list) ? list : [];
}
const str = (value) => (value === null || value === undefined ? null : String(value));
const num = (value) => (value === null || value === undefined ? null : Number(value));
const SELECT = "SELECT s.*, s.expiresAt AS endsAt, u.name AS userName, u.role AS userRole FROM `Subscription` s JOIN `User` u ON u.id = s.userId";
function toRow(row) {
    return {
        id: String(row.id),
        number: Number(row.number ?? 0),
        userId: String(row.userId),
        userName: str(row.userName),
        userRole: str(row.userRole),
        plan: String(row.plan),
        status: String(row.status),
        months: num(row.months),
        amountUsd: num(row.amountUsd),
        method: str(row.method),
        reference: str(row.reference),
        notes: str(row.notes),
        startsAt: row.startsAt,
        endsAt: row.endsAt ?? null,
        verifiedAt: row.verifiedAt ?? null,
        decisionReason: str(row.decisionReason),
        createdAt: row.createdAt,
    };
}
export class MysqlPlanStore {
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
    create(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            const next = rows(await conn.query("SELECT COALESCE(MAX(`number`), 0) + 1 AS n FROM `Subscription`"))[0];
            await conn.query(
            // `active` se mantiene en falso mientras el pago no esté verificado, para que cualquier
            // lectura antigua de esa columna vea lo mismo que el estado nuevo.
            "INSERT INTO `Subscription` (id, `number`, userId, plan, status, active, months, amountUsd, method, reference, notes, startsAt, expiresAt, createdBy, createdAt, updatedAt) " +
                "VALUES (?, ?, ?, ?, 'pendiente', 0, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), NULL, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, Number(next?.n ?? 1), input.userId, input.plan, input.months, input.amountUsd, input.method, input.reference, input.notes, input.createdBy]);
            return id;
        });
    }
    list(filter, page, soonDays = 7) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            let where = "";
            const params = [];
            if (filter === "pendiente")
                where = "WHERE s.status = 'pendiente'";
            else if (filter === "activa")
                where = "WHERE s.status = 'activa' AND (s.expiresAt IS NULL OR s.expiresAt > UTC_TIMESTAMP(3))";
            else if (filter === "por_vencer") {
                where = "WHERE s.status = 'activa' AND s.expiresAt IS NOT NULL AND s.expiresAt > UTC_TIMESTAMP(3) AND s.expiresAt <= DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? DAY)";
                params.push(Math.max(1, Math.floor(soonDays)));
            }
            else if (filter === "vencida")
                where = "WHERE s.status = 'vencida' OR (s.status = 'activa' AND s.expiresAt IS NOT NULL AND s.expiresAt <= UTC_TIMESTAMP(3))";
            const items = rows(await conn.query(`${SELECT} ${where} ORDER BY s.status = 'pendiente' DESC, s.createdAt DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`, params)).map(toRow);
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    get(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT} WHERE s.id = ? LIMIT 1`, [id]))[0];
            return row ? toRow(row) : null;
        });
    }
    forUser(userId) {
        return this.run(async (conn) => rows(await conn.query(`${SELECT} WHERE s.userId = ? ORDER BY s.createdAt DESC LIMIT 20`, [userId])).map(toRow));
    }
    verify(id, months, verifiedBy) {
        return this.run(async (conn) => {
            // El inicio y el vencimiento se calculan en la misma sentencia: así el período es exacto y
            // no depende del reloj ni de la zona horaria de quien verifica.
            const vence = months === null ? "NULL" : "DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? MONTH)";
            const params = months === null ? [verifiedBy, id] : [Math.floor(months), verifiedBy, id];
            const [result] = await conn.query(`UPDATE \`Subscription\` SET status = 'activa', active = 1, expiresAt = ${vence}, verifiedBy = ?, verifiedAt = CURRENT_TIMESTAMP(3), ` +
                "startsAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'pendiente'", params);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    reject(id, reason, verifiedBy) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Subscription` SET status = 'rechazada', active = 0, decisionReason = ?, verifiedBy = ?, verifiedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) " +
                "WHERE id = ? AND status = 'pendiente'", [reason, verifiedBy, id]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    cancel(id, reason, verifiedBy) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Subscription` SET status = 'cancelada', active = 0, decisionReason = ?, verifiedBy = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'activa'", [reason, verifiedBy, id]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    expireDue() {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Subscription` SET status = 'vencida', active = 0, updatedAt = CURRENT_TIMESTAMP(3) WHERE status = 'activa' AND expiresAt IS NOT NULL AND expiresAt <= UTC_TIMESTAMP(3)");
            return Number(result.affectedRows ?? 0);
        });
    }
    pendingCount() {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT COUNT(*) AS n FROM `Subscription` WHERE status = 'pendiente'"))[0];
            return Number(row?.n ?? 0);
        });
    }
    usageForUser(userId) {
        return this.run(async (conn) => {
            const cuenta = async (sql, params) => {
                try {
                    const row = rows(await conn.query(sql, params))[0];
                    return Number(row?.n ?? 0);
                }
                catch {
                    return 0; // una tabla que aún no existe no debe romper la ficha
                }
            };
            const desde = "DATE_FORMAT(UTC_TIMESTAMP(3), '%Y-%m-01')";
            const [vehicles, appointmentsPerMonth, workOrdersPerMonth, quotesPerMonth] = await Promise.all([
                cuenta("SELECT COUNT(*) AS n FROM `Vehicle` WHERE userId = ? AND deletedAt IS NULL", [userId]),
                cuenta(`SELECT COUNT(*) AS n FROM \`Appointment\` WHERE ownerId = ? AND createdAt >= ${desde}`, [userId]),
                cuenta(`SELECT COUNT(*) AS n FROM \`WorkOrder\` w JOIN \`Shop\` s ON s.id = w.shopId WHERE (w.ownerId = ? OR s.userId = ?) AND w.createdAt >= ${desde}`, [userId, userId]),
                cuenta(`SELECT COUNT(*) AS n FROM \`QuoteRequest\` q WHERE q.requesterId = ? AND q.createdAt >= ${desde}`, [userId]),
            ]);
            return { vehicles, appointmentsPerMonth, workOrdersPerMonth, quotesPerMonth };
        });
    }
    planForUser(userId) {
        return this.run(async (conn) => {
            const list = rows(await conn.query("SELECT plan, status, startsAt, expiresAt AS endsAt FROM `Subscription` WHERE userId = ? AND status = 'activa'", [userId])).map((r) => ({
                plan: String(r.plan),
                status: String(r.status),
                startsAt: r.startsAt,
                endsAt: r.endsAt ?? null,
            }));
            return effectivePlan(list);
        });
    }
}
//# sourceMappingURL=plan-store.js.map