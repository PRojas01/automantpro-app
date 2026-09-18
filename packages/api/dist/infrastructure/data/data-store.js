import { anonymizedValues, dueDate } from "../../application/data/lopdp.js";
export const DATASETS = [
    {
        key: "usuarios",
        label: "Usuarios",
        personal: true,
        columns: [
            ["id", "Id"],
            ["role", "Perfil"],
            ["name", "Nombre"],
            ["phone", "Teléfono"],
            ["email", "Correo"],
            ["city", "Ciudad"],
            ["consentAt", "Consentimiento"],
            ["consentVersion", "Versión"],
            ["source", "Cómo nos conoció"],
            ["createdAt", "Alta"],
        ],
        sql: "SELECT id, role, name, phone, email, city, consentAt, consentVersion, source, createdAt FROM `User` WHERE role <> 'admin' ORDER BY createdAt DESC",
    },
    {
        key: "vehiculos",
        label: "Vehículos",
        personal: true,
        columns: [
            ["id", "Id"],
            ["ownerName", "Dueño"],
            ["make", "Marca"],
            ["model", "Modelo"],
            ["year", "Año"],
            ["plate", "Placa"],
            ["currentKm", "Km"],
            ["vehicleClass", "Clase"],
            ["fuel", "Combustible"],
            ["createdAt", "Alta"],
        ],
        sql: "SELECT v.id, u.name AS ownerName, v.make, v.model, v.year, v.plate, v.currentKm, v.vehicleClass, v.fuel, v.createdAt FROM `Vehicle` v JOIN `User` u ON u.id = v.userId ORDER BY v.createdAt DESC",
    },
    {
        key: "talleres",
        label: "Talleres",
        personal: true,
        columns: [
            ["id", "Id"],
            ["name", "Nombre"],
            ["ruc", "RUC"],
            ["city", "Ciudad"],
            ["zone", "Zona"],
            ["contactName", "Contacto"],
            ["email", "Correo"],
            ["verificationStatus", "Verificación"],
            ["ratingAvg", "Calificación"],
            ["createdAt", "Alta"],
        ],
        sql: "SELECT id, name, ruc, city, zone, contactName, email, verificationStatus, ratingAvg, createdAt FROM `Shop` ORDER BY createdAt DESC",
    },
    {
        key: "almacenes",
        label: "Almacenes",
        personal: true,
        columns: [
            ["id", "Id"],
            ["name", "Nombre"],
            ["ruc", "RUC"],
            ["city", "Ciudad"],
            ["zone", "Zona"],
            ["categories", "Categorías"],
            ["delivery", "Entrega"],
            ["verificationStatus", "Verificación"],
            ["createdAt", "Alta"],
        ],
        sql: "SELECT id, name, ruc, city, zone, categories, delivery, verificationStatus, createdAt FROM `Store` ORDER BY createdAt DESC",
    },
    {
        key: "turnos",
        label: "Turnos",
        personal: true,
        columns: [
            ["id", "Id"],
            ["scheduledAt", "Fecha"],
            ["status", "Estado"],
            ["ownerName", "Dueño"],
            ["shopName", "Taller"],
            ["summary", "Servicios"],
            ["createdAt", "Creado"],
        ],
        sql: "SELECT a.id, a.scheduledAt, a.status, o.name AS ownerName, s.name AS shopName, a.summary, a.createdAt FROM `Appointment` a JOIN `User` o ON o.id = a.ownerId JOIN `Shop` s ON s.id = a.shopId ORDER BY a.scheduledAt DESC",
    },
    {
        key: "ordenes",
        label: "Órdenes de trabajo",
        personal: true,
        columns: [
            ["number", "Número"],
            ["status", "Estado"],
            ["ownerName", "Dueño"],
            ["shopName", "Taller"],
            ["intakeKm", "Km ingreso"],
            ["exitKm", "Km salida"],
            ["total", "Total"],
            ["warrantyDays", "Garantía (días)"],
            ["createdAt", "Apertura"],
            ["closedAt", "Cierre"],
        ],
        sql: "SELECT w.number, w.status, o.name AS ownerName, s.name AS shopName, w.intakeKm, w.exitKm, w.total, w.warrantyDays, w.createdAt, w.closedAt FROM `WorkOrder` w JOIN `User` o ON o.id = w.ownerId JOIN `Shop` s ON s.id = w.shopId ORDER BY w.number DESC",
    },
    {
        key: "cotizaciones",
        label: "Cotizaciones",
        personal: true,
        columns: [
            ["number", "Número"],
            ["status", "Estado"],
            ["requesterName", "Solicita"],
            ["partName", "Repuesto"],
            ["quantity", "Cantidad"],
            ["city", "Ciudad"],
            ["respuestas", "Respuestas"],
            ["createdAt", "Creada"],
        ],
        sql: "SELECT q.number, q.status, u.name AS requesterName, q.partName, q.quantity, q.city, (SELECT COUNT(*) FROM `Quote` c WHERE c.requestId = q.id AND c.status = 'cotizado') AS respuestas, q.createdAt FROM `QuoteRequest` q JOIN `User` u ON u.id = q.requesterId ORDER BY q.number DESC",
    },
    {
        key: "relaciones",
        label: "Relaciones",
        personal: false,
        columns: [
            ["number", "Vínculo"],
            ["kind", "Tipo"],
            ["status", "Estado"],
            ["channel", "Canal"],
            ["originType", "Origen"],
            ["mensajes", "Mensajes"],
            ["createdAt", "Creado"],
            ["closedAt", "Cierre"],
        ],
        sql: "SELECT r.number, r.kind, r.status, r.channel, r.originType, (SELECT COUNT(*) FROM `RelationshipMessage` m WHERE m.relationshipId = r.id) AS mensajes, r.createdAt, r.closedAt FROM `Relationship` r ORDER BY r.number DESC",
    },
    {
        key: "sanciones",
        label: "Sanciones",
        personal: true,
        columns: [
            ["userName", "Entidad"],
            ["level", "Paso"],
            ["reason", "Motivo"],
            ["startsAt", "Desde"],
            ["endsAt", "Hasta"],
            ["liftedAt", "Levantada"],
        ],
        sql: "SELECT u.name AS userName, s.level, s.reason, s.startsAt, s.endsAt, s.liftedAt FROM `Sanction` s JOIN `User` u ON u.id = s.userId ORDER BY s.createdAt DESC",
    },
    {
        key: "auditoria",
        label: "Auditoría",
        personal: false,
        columns: [
            ["createdAt", "Fecha"],
            ["eventType", "Evento"],
            ["actorRole", "Rol"],
            ["reason", "Detalle"],
        ],
        sql: "SELECT createdAt, eventType, actorRole, reason FROM `AuditLog` ORDER BY createdAt DESC",
    },
];
const PAGE_SIZE = 25;
const MAX_ROWS = 5000;
function rows(result) {
    const [list] = result;
    return Array.isArray(list) ? list : [];
}
const str = (value) => (value === null || value === undefined ? null : String(value));
function toRequest(row) {
    return {
        id: String(row.id),
        number: Number(row.number ?? 0),
        userId: String(row.userId),
        userName: str(row.userName),
        kind: String(row.kind),
        status: String(row.status),
        channel: str(row.channel),
        detail: str(row.detail),
        resolution: str(row.resolution),
        dueAt: row.dueAt,
        anonymizedAt: row.anonymizedAt ?? null,
        exportedAt: row.exportedAt ?? null,
        createdAt: row.createdAt,
        resolvedAt: row.resolvedAt ?? null,
    };
}
const SELECT_REQUESTS = "SELECT d.*, u.name AS userName FROM `DataRequest` d JOIN `User` u ON u.id = d.userId";
export class MysqlDataStore {
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
    exportRows(dataset, limit = MAX_ROWS) {
        const found = DATASETS.find((d) => d.key === dataset);
        if (!found)
            return Promise.resolve([]);
        const cap = Math.min(Math.max(1, Math.floor(limit)), MAX_ROWS);
        return this.run(async (conn) => rows(await conn.query(`${found.sql} LIMIT ${cap}`)));
    }
    createRequest(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            const next = rows(await conn.query("SELECT COALESCE(MAX(`number`), 0) + 1 AS n FROM `DataRequest`"))[0];
            await conn.query("INSERT INTO `DataRequest` (id, `number`, userId, kind, status, channel, detail, dueAt, createdBy, createdAt, updatedAt) " +
                "VALUES (?, ?, ?, ?, 'recibida', ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, Number(next?.n ?? 1), input.userId, input.kind, input.channel, input.detail, dueDate(), input.createdBy]);
            return id;
        });
    }
    listRequests(status, page) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            const where = status === "todas" ? "" : "WHERE d.status = ?";
            const params = status === "todas" ? [] : [status];
            const items = rows(await conn.query(`${SELECT_REQUESTS} ${where} ORDER BY d.dueAt ASC LIMIT ${PAGE_SIZE} OFFSET ${offset}`, params)).map(toRequest);
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    getRequest(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT_REQUESTS} WHERE d.id = ? LIMIT 1`, [id]))[0];
            return row ? toRequest(row) : null;
        });
    }
    requestsForUser(userId) {
        return this.run(async (conn) => rows(await conn.query(`${SELECT_REQUESTS} WHERE d.userId = ? ORDER BY d.createdAt DESC LIMIT 20`, [userId])).map(toRequest));
    }
    setStatus(id, status, resolution, resolvedBy) {
        return this.run(async (conn) => {
            const closing = status === "atendida" || status === "rechazada";
            const [result] = await conn.query("UPDATE `DataRequest` SET status = ?, resolution = ?, resolvedBy = ?, resolvedAt = " +
                (closing ? "CURRENT_TIMESTAMP(3)" : "NULL") +
                ", updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status IN ('recibida', 'en_proceso')", [status, resolution, resolvedBy, id]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    markExported(id) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `DataRequest` SET exportedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [id]);
        });
    }
    personalExport(userId) {
        return this.run(async (conn) => {
            const user = rows(await conn.query("SELECT id, role, name, phone, email, city, consentAt, consentVersion, source, notes, createdAt FROM `User` WHERE id = ? LIMIT 1", [userId]))[0];
            if (!user)
                return null;
            const [vehicles, appointments, workOrders, quotes, relations, sanctions] = await Promise.all([
                conn.query("SELECT make, model, year, plate, currentKm, vehicleClass, fuel, createdAt FROM `Vehicle` WHERE userId = ? AND deletedAt IS NULL", [userId]).then(rows),
                conn
                    .query("SELECT a.scheduledAt, a.status, a.summary, s.name AS shopName, a.createdAt FROM `Appointment` a JOIN `Shop` s ON s.id = a.shopId WHERE a.ownerId = ?", [userId])
                    .then(rows),
                conn
                    .query("SELECT w.number, w.status, w.intakeKm, w.exitKm, w.total, w.warrantyDays, s.name AS shopName, w.createdAt, w.closedAt FROM `WorkOrder` w JOIN `Shop` s ON s.id = w.shopId WHERE w.ownerId = ?", [userId])
                    .then(rows),
                conn.query("SELECT `number`, status, partName, quantity, city, createdAt FROM `QuoteRequest` WHERE requesterId = ?", [userId]).then(rows),
                conn
                    .query("SELECT r.`number`, r.kind, r.status, r.channel, r.createdAt FROM `Relationship` r JOIN `RelationshipParty` p ON p.relationshipId = r.id WHERE p.userId = ?", [userId])
                    .then(rows)
                    .catch(() => []),
                conn.query("SELECT level, reason, startsAt, endsAt, liftedAt FROM `Sanction` WHERE userId = ?", [userId]).then(rows).catch(() => []),
            ]);
            return { user, vehicles, appointments, workOrders, quotes, relations, sanctions };
        });
    }
    anonymizeUser(userId, requestId) {
        return this.run(async (conn) => {
            const values = anonymizedValues(userId);
            const [result] = await conn.query("UPDATE `User` SET name = ?, phone = ?, email = NULL, notes = NULL, deletedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) " +
                "WHERE id = ? AND role <> 'admin' AND deletedAt IS NULL", [values.name, values.phone, userId]);
            const changed = Number(result.affectedRows ?? 0) > 0;
            if (changed) {
                // La placa también identifica a una persona: se quita y se conserva el historial técnico.
                await conn.query("UPDATE `Vehicle` SET plate = NULL, updatedAt = CURRENT_TIMESTAMP(3) WHERE userId = ?", [userId]).catch(() => undefined);
                if (requestId) {
                    await conn.query("UPDATE `DataRequest` SET anonymizedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [requestId]);
                }
            }
            return changed;
        });
    }
}
//# sourceMappingURL=data-store.js.map