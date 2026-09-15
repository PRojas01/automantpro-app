const PAGE_SIZE = 25;
const SELECT_ORDERS = "SELECT w.id, w.number, w.status, w.appointmentId, w.intakeKm, w.intakeNotes, w.diagnosis, w.rejectionReason, w.cancelReason, " +
    "w.exitKm, w.warrantyDays, w.nextService, w.diagnosisOutcome, w.outcomeNote, w.total, w.createdAt, w.closedAt, " +
    "s.id AS shopId, s.name AS shopName, su.id AS shopUserId, su.phone AS shopPhone, o.id AS ownerId, o.name AS ownerName, o.phone AS ownerPhone, " +
    "v.id AS vehicleId, v.make, v.model, v.year, v.plate, v.currentKm " +
    "FROM `WorkOrder` w JOIN `Shop` s ON s.id = w.shopId JOIN `User` su ON su.id = s.userId " +
    "JOIN `User` o ON o.id = w.ownerId JOIN `Vehicle` v ON v.id = w.vehicleId";
const LIST_OPEN = `${SELECT_ORDERS} WHERE w.status NOT IN ('cerrada', 'cancelada') ORDER BY w.createdAt DESC LIMIT ? OFFSET ?`;
const LIST_TO_APPROVE = `${SELECT_ORDERS} WHERE w.status = 'presupuesto_enviado' ORDER BY w.createdAt DESC LIMIT ? OFFSET ?`;
const LIST_IN_SHOP = `${SELECT_ORDERS} WHERE w.status IN ('aprobado', 'en_ejecucion', 'esperando_repuesto') ORDER BY w.createdAt DESC LIMIT ? OFFSET ?`;
const LIST_CLOSED = `${SELECT_ORDERS} WHERE w.status = 'cerrada' ORDER BY w.closedAt DESC LIMIT ? OFFSET ?`;
const LIST_ALL = `${SELECT_ORDERS} ORDER BY w.createdAt DESC LIMIT ? OFFSET ?`;
const GET_ONE = `${SELECT_ORDERS} WHERE w.id = ? LIMIT 1`;
const FOR_USER = `${SELECT_ORDERS} WHERE w.ownerId = ? OR su.id = ? ORDER BY w.createdAt DESC LIMIT 20`;
const RECALCULATE_TOTAL = "UPDATE `WorkOrder` SET total = (SELECT COALESCE(SUM(ROUND(quantity * unitPrice, 2)), 0) FROM `WorkOrderItem` WHERE workOrderId = ?), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?";
function rows(result) {
    return Array.isArray(result[0]) ? result[0] : [];
}
const text = (value) => (value === null || value === undefined ? null : String(value));
const int = (value) => (value === null || value === undefined ? null : Number(value));
function toOrder(r) {
    return {
        id: String(r.id),
        number: Number(r.number),
        status: String(r.status),
        shopId: String(r.shopId),
        shopName: String(r.shopName),
        shopUserId: String(r.shopUserId),
        shopPhone: String(r.shopPhone),
        ownerId: String(r.ownerId),
        ownerName: String(r.ownerName),
        ownerPhone: String(r.ownerPhone),
        vehicleId: String(r.vehicleId),
        vehicleLabel: [r.make, r.model, r.year].filter((v) => v !== null && v !== undefined && v !== "").join(" "),
        plate: text(r.plate),
        vehicleKm: Number(r.currentKm ?? 0),
        appointmentId: text(r.appointmentId),
        intakeKm: int(r.intakeKm),
        intakeNotes: text(r.intakeNotes),
        diagnosis: text(r.diagnosis),
        rejectionReason: text(r.rejectionReason),
        cancelReason: text(r.cancelReason),
        exitKm: int(r.exitKm),
        warrantyDays: int(r.warrantyDays),
        nextService: text(r.nextService),
        diagnosisOutcome: text(r.diagnosisOutcome),
        outcomeNote: text(r.outcomeNote),
        total: Number(r.total ?? 0),
        createdAt: r.createdAt,
        closedAt: r.closedAt ?? null,
    };
}
function toItem(r) {
    return {
        id: String(r.id),
        kind: String(r.kind),
        description: String(r.description),
        brand: text(r.brand),
        partCode: text(r.partCode),
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
    };
}
export class MysqlWorkOrderStore {
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
    transaction(work) {
        return this.run(async (conn) => {
            await conn.query("START TRANSACTION");
            try {
                const result = await work(conn);
                await conn.query("COMMIT");
                return result;
            }
            catch (err) {
                await conn.query("ROLLBACK").catch(() => undefined);
                throw err;
            }
        });
    }
    async create(input) {
        const attempt = () => this.transaction(async (conn) => {
            const id = String(rows(await conn.query("SELECT UUID() AS id"))[0]?.id);
            const next = Number(rows(await conn.query("SELECT COALESCE(MAX(number), 0) + 1 AS n FROM `WorkOrder` FOR UPDATE"))[0]?.n ?? 1);
            await conn.query("INSERT INTO `WorkOrder` (id, number, shopId, ownerId, vehicleId, appointmentId, status, intakeKm, intakeNotes, diagnosis, total, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'recepcion', ?, ?, ?, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, next, input.shopId, input.ownerId, input.vehicleId, input.appointmentId, input.intakeKm, input.intakeNotes, input.diagnosis]);
            return id;
        });
        try {
            return await attempt();
        }
        catch (err) {
            // Dos altas simultáneas pueden chocar en el número correlativo: se reintenta una vez.
            if (err.code === "ER_DUP_ENTRY")
                return attempt();
            throw err;
        }
    }
    get(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(GET_ONE, [id]))[0];
            if (!row)
                return null;
            const items = rows(await conn.query("SELECT id, kind, description, brand, partCode, quantity, unitPrice FROM `WorkOrderItem` WHERE workOrderId = ? ORDER BY createdAt", [id])).map(toItem);
            return { order: toOrder(row), items };
        });
    }
    list(filter, page) {
        return this.run(async (conn) => {
            const params = [PAGE_SIZE, (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE];
            const sql = filter === "abiertas"
                ? LIST_OPEN
                : filter === "por_aprobar"
                    ? LIST_TO_APPROVE
                    : filter === "en_taller"
                        ? LIST_IN_SHOP
                        : filter === "cerradas"
                            ? LIST_CLOSED
                            : LIST_ALL;
            return { items: rows(await conn.query(sql, params)).map(toOrder), page, pageSize: PAGE_SIZE };
        });
    }
    listForUser(userId) {
        return this.run(async (conn) => rows(await conn.query(FOR_USER, [userId, userId])).map(toOrder));
    }
    findByAppointment(appointmentId) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT id FROM `WorkOrder` WHERE appointmentId = ? AND status <> 'cancelada' ORDER BY createdAt DESC LIMIT 1", [appointmentId]))[0];
            return row ? String(row.id) : null;
        });
    }
    addItem(workOrderId, item) {
        return this.transaction(async (conn) => {
            await conn.query("INSERT INTO `WorkOrderItem` (id, workOrderId, kind, description, brand, partCode, quantity, unitPrice, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))", [workOrderId, item.kind, item.description, item.brand, item.partCode, item.quantity, item.unitPrice]);
            await conn.query(RECALCULATE_TOTAL, [workOrderId, workOrderId]);
        });
    }
    removeItem(workOrderId, itemId) {
        return this.transaction(async (conn) => {
            await conn.query("DELETE FROM `WorkOrderItem` WHERE id = ? AND workOrderId = ?", [itemId, workOrderId]);
            await conn.query(RECALCULATE_TOTAL, [workOrderId, workOrderId]);
        });
    }
    updateDiagnosis(id, diagnosis) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `WorkOrder` SET diagnosis = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [diagnosis, id]);
        });
    }
    setStatus(id, expected, next, fields = {}) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `WorkOrder` SET status = ?, rejectionReason = COALESCE(?, rejectionReason), cancelReason = COALESCE(?, cancelReason), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = ?", [next, fields.rejectionReason ?? null, fields.cancelReason ?? null, id, expected]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    close(id, input) {
        return this.transaction(async (conn) => {
            const order = rows(await conn.query("SELECT vehicleId, shopId, appointmentId, total FROM `WorkOrder` WHERE id = ? AND status IN ('en_ejecucion', 'esperando_repuesto') FOR UPDATE", [id]))[0];
            if (!order)
                return false;
            await conn.query("UPDATE `WorkOrder` SET status = 'cerrada', exitKm = ?, warrantyDays = ?, nextService = ?, diagnosisOutcome = ?, outcomeNote = ?, closedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [input.exitKm, input.warrantyDays, input.nextService, input.diagnosisOutcome, input.outcomeNote, id]);
            await conn.query("INSERT INTO `Service` (id, vehicleId, shopId, appointmentId, description, cost, status, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?, 'done', CURRENT_TIMESTAMP(3))", [order.vehicleId, order.shopId, order.appointmentId ?? null, input.historyDescription, order.total]);
            await conn.query("UPDATE `Vehicle` SET currentKm = GREATEST(currentKm, ?), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [input.exitKm, order.vehicleId]);
            if (order.appointmentId) {
                await conn.query("UPDATE `Appointment` SET status = 'completed', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status IN ('pending', 'confirmed')", [order.appointmentId]);
            }
            return true;
        });
    }
    historyForUser(userId) {
        return this.run(async (conn) => rows(await conn.query("SELECT s.createdAt, sh.name AS shopName, v.make, v.model, v.year, s.description, s.cost FROM `Service` s JOIN `Vehicle` v ON v.id = s.vehicleId JOIN `Shop` sh ON sh.id = s.shopId WHERE v.userId = ? ORDER BY s.createdAt DESC LIMIT 30", [userId])).map((r) => ({
            createdAt: r.createdAt,
            shopName: String(r.shopName),
            vehicleLabel: [r.make, r.model, r.year].filter((v) => v !== null && v !== undefined && v !== "").join(" "),
            description: String(r.description),
            cost: r.cost === null || r.cost === undefined ? null : Number(r.cost),
        })));
    }
}
//# sourceMappingURL=work-order-store.js.map