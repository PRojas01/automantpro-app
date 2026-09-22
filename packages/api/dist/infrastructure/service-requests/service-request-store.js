import { NOT_SANCTIONED } from "../appointments/appointment-store.js";
const PAGE_SIZE = 25;
function rows(result) {
    const [list] = result;
    return Array.isArray(list) ? list : [];
}
const text = (value) => (value === null || value === undefined ? null : String(value));
const numberOrNull = (value) => (value === null || value === undefined ? null : Number(value));
function stringList(value) {
    if (Array.isArray(value))
        return value.map(String);
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed))
                return parsed.map(String);
        }
        catch {
            return value.split(",").map((v) => v.trim()).filter(Boolean);
        }
    }
    return [];
}
const SELECT_REQUESTS = "SELECT r.*, u.name AS ownerName, u.phone AS ownerPhone, v.make, v.model, v.year, " +
    "(SELECT COUNT(*) FROM `ServiceOffer` o WHERE o.requestId = r.id AND o.status = 'ofertado') AS respuestas " +
    "FROM `ServiceRequest` r JOIN `User` u ON u.id = r.ownerId LEFT JOIN `Vehicle` v ON v.id = r.vehicleId";
function toRequest(row) {
    const label = row.make ? `${String(row.make)} ${String(row.model ?? "")} ${String(row.year ?? "")}`.trim() : null;
    return {
        id: String(row.id),
        number: Number(row.number ?? 0),
        ownerId: String(row.ownerId),
        ownerName: String(row.ownerName ?? ""),
        ownerPhone: String(row.ownerPhone ?? ""),
        vehicleId: text(row.vehicleId),
        vehicleLabel: label,
        category: String(row.category),
        description: String(row.description ?? ""),
        city: text(row.city),
        zone: text(row.zone),
        status: String(row.status),
        chosenOfferId: text(row.chosenOfferId),
        closeReason: text(row.closeReason),
        createdAt: row.createdAt,
        respuestas: Number(row.respuestas ?? 0),
    };
}
function toOffer(row) {
    return {
        id: String(row.id),
        requestId: String(row.requestId),
        shopId: String(row.shopId),
        shopName: String(row.shopName ?? ""),
        shopUserId: String(row.shopUserId ?? ""),
        shopCity: String(row.shopCity ?? ""),
        shopZone: text(row.shopZone),
        status: String(row.status),
        priceUsd: numberOrNull(row.priceUsd),
        durationMin: numberOrNull(row.durationMin),
        availability: text(row.availability),
        warrantyDays: numberOrNull(row.warrantyDays),
        notes: text(row.notes),
        respondedAt: row.respondedAt ?? null,
    };
}
export class MysqlServiceRequestStore {
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
    candidates(city) {
        const base = "SELECT sh.id, sh.name, sh.city, sh.zone, sh.specialties, sh.ratingAvg FROM `Shop` sh WHERE sh.verificationStatus = 'verified' " +
            "AND (? = '' OR LOWER(TRIM(sh.city)) = LOWER(TRIM(?))) ";
        return this.run(async (conn) => rows(await conn.query(`${base}${NOT_SANCTIONED("sh")}ORDER BY sh.ratingAvg DESC, sh.name LIMIT 100`, [city.trim(), city.trim()]).catch((err) => {
            if (err.code !== "ER_NO_SUCH_TABLE")
                throw err;
            return conn.query(`${base}ORDER BY sh.name LIMIT 100`, [city.trim(), city.trim()]);
        })).map((row) => ({
            id: String(row.id),
            name: String(row.name),
            city: String(row.city),
            zone: text(row.zone),
            services: stringList(row.specialties),
            ratingAvg: Number(row.ratingAvg ?? 0),
        })));
    }
    create(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            const next = rows(await conn.query("SELECT COALESCE(MAX(`number`), 0) + 1 AS n FROM `ServiceRequest`"))[0];
            await conn.query("INSERT INTO `ServiceRequest` (id, `number`, ownerId, vehicleId, category, description, city, zone, status, createdBy, createdAt, updatedAt) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, Number(next?.n ?? 1), input.ownerId, input.vehicleId, input.category, input.description, input.city, input.zone, input.createdBy]);
            for (const shopId of input.shopIds) {
                await conn.query("INSERT INTO `ServiceOffer` (id, requestId, shopId, status, createdAt) VALUES (UUID(), ?, ?, 'invitado', CURRENT_TIMESTAMP(3))", [id, shopId]);
            }
            return id;
        });
    }
    list(filter, page) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            let where = "";
            if (filter === "abiertas")
                where = "WHERE r.status = 'abierta'";
            else if (filter === "sin_respuesta")
                where = "WHERE r.status = 'abierta' AND (SELECT COUNT(*) FROM `ServiceOffer` o WHERE o.requestId = r.id AND o.status = 'ofertado') = 0";
            else if (filter === "cerradas")
                where = "WHERE r.status IN ('cerrada', 'cancelada')";
            const items = rows(await conn.query(`${SELECT_REQUESTS} ${where} ORDER BY r.createdAt DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`)).map(toRequest);
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    get(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT_REQUESTS} WHERE r.id = ? LIMIT 1`, [id]))[0];
            if (!row)
                return null;
            const offers = rows(await conn.query("SELECT o.*, s.name AS shopName, s.city AS shopCity, s.zone AS shopZone, s.userId AS shopUserId FROM `ServiceOffer` o " +
                "JOIN `Shop` s ON s.id = o.shopId WHERE o.requestId = ? ORDER BY o.status = 'ofertado' DESC, o.priceUsd IS NULL, o.priceUsd ASC, s.name", [id])).map(toOffer);
            return { request: toRequest(row), offers };
        });
    }
    forUser(userId) {
        return this.run(async (conn) => rows(await conn.query(`${SELECT_REQUESTS} WHERE r.ownerId = ? OR EXISTS (SELECT 1 FROM \`ServiceOffer\` o JOIN \`Shop\` s ON s.id = o.shopId WHERE o.requestId = r.id AND s.userId = ?) ORDER BY r.createdAt DESC LIMIT 20`, [userId, userId])).map(toRequest));
    }
    saveOffer(requestId, offerId, response) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `ServiceOffer` o JOIN `ServiceRequest` r ON r.id = o.requestId SET o.status = ?, o.priceUsd = ?, o.durationMin = ?, o.availability = ?, " +
                "o.warrantyDays = ?, o.notes = ?, o.respondedAt = CURRENT_TIMESTAMP(3) WHERE o.id = ? AND o.requestId = ? AND r.status = 'abierta' " +
                "AND o.status IN ('invitado', 'ofertado', 'sin_disponibilidad')", [response.status, response.priceUsd, response.durationMin, response.availability, response.warrantyDays, response.notes, offerId, requestId]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    choose(requestId, offerId) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `ServiceRequest` SET status = 'cerrada', chosenOfferId = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'abierta'", [offerId, requestId]);
            const changed = Number(result.affectedRows ?? 0) > 0;
            if (!changed)
                return false;
            await conn.query("UPDATE `ServiceOffer` SET status = 'elegido' WHERE id = ? AND requestId = ?", [offerId, requestId]);
            await conn.query("UPDATE `ServiceOffer` SET status = 'descartado' WHERE requestId = ? AND id <> ? AND status <> 'sin_disponibilidad'", [requestId, offerId]);
            return true;
        });
    }
    close(requestId, reason) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `ServiceRequest` SET status = 'cancelada', closeReason = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'abierta'", [reason, requestId]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
}
//# sourceMappingURL=service-request-store.js.map