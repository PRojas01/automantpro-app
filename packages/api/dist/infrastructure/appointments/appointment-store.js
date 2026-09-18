import { ecDayRange } from "../../application/appointments/messages.js";
const PAGE_SIZE = 25;
/** Excluye a quien tiene una sanción vigente que bloquea búsquedas (docs/35 M5). */
export const NOT_SANCTIONED = (alias) => "AND NOT EXISTS (SELECT 1 FROM `Sanction` sn WHERE sn.userId = " +
    alias +
    ".userId AND sn.liftedAt IS NULL AND sn.startsAt <= UTC_TIMESTAMP(3) " +
    "AND (sn.endsAt IS NULL OR sn.endsAt > UTC_TIMESTAMP(3)) AND sn.level IN ('suspension_busquedas', 'suspension', 'baja')) ";
const SELECT_APPOINTMENTS = "SELECT a.id, a.scheduledAt, a.status, a.summary, a.services, a.notes, a.cancelReason, a.createdAt, " +
    "v.id AS vehicleId, v.make, v.model, v.year, v.plate, o.id AS ownerId, o.name AS ownerName, o.phone AS ownerPhone, " +
    "s.id AS shopId, s.name AS shopName, s.address AS shopAddress, s.city AS shopCity, su.id AS shopUserId, su.phone AS shopPhone " +
    "FROM `Appointment` a JOIN `Vehicle` v ON v.id = a.vehicleId JOIN `User` o ON o.id = a.ownerId " +
    "JOIN `Shop` s ON s.id = a.shopId JOIN `User` su ON su.id = s.userId";
const LIST_TODAY = `${SELECT_APPOINTMENTS} WHERE a.scheduledAt >= ? AND a.scheduledAt < ? ORDER BY a.scheduledAt ASC LIMIT ? OFFSET ?`;
const LIST_UPCOMING = `${SELECT_APPOINTMENTS} WHERE a.scheduledAt >= ? AND a.status IN ('pending', 'confirmed') ORDER BY a.scheduledAt ASC LIMIT ? OFFSET ?`;
const LIST_PENDING = `${SELECT_APPOINTMENTS} WHERE a.status = 'pending' ORDER BY a.scheduledAt ASC LIMIT ? OFFSET ?`;
const LIST_ALL = `${SELECT_APPOINTMENTS} ORDER BY a.scheduledAt DESC LIMIT ? OFFSET ?`;
const GET_ONE = `${SELECT_APPOINTMENTS} WHERE a.id = ? LIMIT 1`;
const FOR_USER = `${SELECT_APPOINTMENTS} WHERE a.ownerId = ? OR su.id = ? ORDER BY a.scheduledAt DESC LIMIT 20`;
function rows(result) {
    return Array.isArray(result[0]) ? result[0] : [];
}
function jsonValue(raw) {
    if (typeof raw !== "string")
        return raw;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function stringList(raw) {
    const value = jsonValue(raw);
    return Array.isArray(value) ? value.map(String) : [];
}
const text = (value) => (value === null || value === undefined ? null : String(value));
function toAppointment(r) {
    return {
        id: String(r.id),
        scheduledAt: r.scheduledAt,
        status: String(r.status),
        summary: text(r.summary),
        services: stringList(r.services),
        notes: text(r.notes),
        cancelReason: text(r.cancelReason),
        createdAt: r.createdAt,
        vehicleId: String(r.vehicleId),
        vehicleLabel: [r.make, r.model, r.year].filter((v) => v !== null && v !== undefined && v !== "").join(" "),
        plate: text(r.plate),
        ownerId: String(r.ownerId),
        ownerName: String(r.ownerName),
        ownerPhone: String(r.ownerPhone),
        shopId: String(r.shopId),
        shopName: String(r.shopName),
        shopAddress: String(r.shopAddress),
        shopCity: String(r.shopCity),
        shopUserId: String(r.shopUserId),
        shopPhone: String(r.shopPhone),
    };
}
export class MysqlAppointmentStore {
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
    verifiedShops(city) {
        // Los talleres con una sanción vigente que bloquea búsquedas no aparecen (docs/35 M5). Si la
        // tabla Sanction todavía no existe (esquema recién publicado), se consulta sin ese filtro.
        const base = "SELECT id, name, address, city, zone, hours, ratingAvg, specialties FROM `Shop` sh WHERE verificationStatus = 'verified' " +
            "AND (? = '' OR LOWER(TRIM(city)) = LOWER(TRIM(?))) ";
        const filter = NOT_SANCTIONED("sh");
        return this.run(async (conn) => rows(await conn.query(`${base}${filter}ORDER BY name LIMIT 200`, [city.trim(), city.trim()]).catch((err) => {
            if (err.code !== "ER_NO_SUCH_TABLE")
                throw err;
            return conn.query(`${base}ORDER BY name LIMIT 200`, [city.trim(), city.trim()]);
        })).map((r) => ({
            id: String(r.id),
            name: String(r.name),
            address: String(r.address),
            city: String(r.city),
            zone: text(r.zone),
            hours: text(r.hours),
            ratingAvg: Number(r.ratingAvg ?? 0),
            services: stringList(r.specialties),
        })));
    }
    createAppointment(input) {
        return this.run(async (conn) => {
            const id = String(rows(await conn.query("SELECT UUID() AS id"))[0]?.id);
            await conn.query("INSERT INTO `Appointment` (id, vehicleId, shopId, ownerId, scheduledAt, status, summary, services, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, input.vehicleId, input.shopId, input.ownerId, input.scheduledAt, input.summary, JSON.stringify(input.services), input.notes]);
            return id;
        });
    }
    getAppointment(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(GET_ONE, [id]))[0];
            return row ? toAppointment(row) : null;
        });
    }
    listAppointments(filter, page, now = new Date()) {
        return this.run(async (conn) => {
            const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
            let result;
            if (filter === "hoy") {
                const { start, end } = ecDayRange(now);
                result = await conn.query(LIST_TODAY, [start, end, PAGE_SIZE, offset]);
            }
            else if (filter === "proximos") {
                result = await conn.query(LIST_UPCOMING, [now, PAGE_SIZE, offset]);
            }
            else if (filter === "pendientes") {
                result = await conn.query(LIST_PENDING, [PAGE_SIZE, offset]);
            }
            else {
                result = await conn.query(LIST_ALL, [PAGE_SIZE, offset]);
            }
            return { items: rows(result).map(toAppointment), page, pageSize: PAGE_SIZE };
        });
    }
    listForUser(userId) {
        return this.run(async (conn) => rows(await conn.query(FOR_USER, [userId, userId])).map(toAppointment));
    }
    setStatus(id, status, cancelReason) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Appointment` SET status = ?, cancelReason = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [status, cancelReason, id]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    recordEvent(input) {
        return this.run(async (conn) => {
            await conn.query("INSERT INTO `Event` (id, type, actorUserId, actorRole, entityType, entityId, payload, createdAt) VALUES (UUID(), ?, ?, 'admin', ?, ?, ?, CURRENT_TIMESTAMP(3))", [input.type, input.actorUserId, input.entityType, input.entityId, JSON.stringify(input.payload)]);
        });
    }
    userEvents(userId, limit) {
        return this.run(async (conn) => rows(await conn.query("SELECT type, payload, createdAt FROM `Event` WHERE entityType = 'User' AND entityId = ? ORDER BY createdAt DESC LIMIT ?", [userId, limit])).map((r) => {
            const payload = jsonValue(r.payload);
            return {
                type: String(r.type),
                payload: payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {},
                createdAt: r.createdAt,
            };
        }));
    }
}
//# sourceMappingURL=appointment-store.js.map