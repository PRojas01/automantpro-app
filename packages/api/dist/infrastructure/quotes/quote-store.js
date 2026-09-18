import { NOT_SANCTIONED } from "../appointments/appointment-store.js";
import { ORDER_STATUS_FOR_STAGE } from "../../application/quotes/workflow.js";
const PAGE_SIZE = 25;
const SELECT_REQUESTS = "SELECT q.id, q.number, q.status, q.requesterId, u.name AS requesterName, u.phone AS requesterPhone, u.role AS requesterRole, " +
    "q.vehicleId, v.make, v.model, v.year, v.plate, q.workOrderId, q.partName, q.partCode, q.quantity, q.city, q.notes, q.closeReason, q.createdAt " +
    "FROM `QuoteRequest` q JOIN `User` u ON u.id = q.requesterId LEFT JOIN `Vehicle` v ON v.id = q.vehicleId";
const SELECT_QUOTES = "SELECT qt.id, qt.requestId, qt.storeId, s.name AS storeName, s.city AS storeCity, s.userId AS storeUserId, su.phone AS storePhone, " +
    "qt.status, qt.unitPrice, qt.brand, qt.availability, qt.warrantyDays, qt.deliveryTime, qt.validDays, qt.notes, qt.lossReason, qt.respondedAt " +
    "FROM `Quote` qt JOIN `Store` s ON s.id = qt.storeId JOIN `User` su ON su.id = s.userId";
const SELECT_ORDERS = "SELECT o.id, o.stage, o.status, o.total, o.cancelReason, o.createdAt, o.quoteRequestId, o.quoteId, q.number AS requestNumber, q.partName, q.quantity, " +
    "s.id AS storeId, s.name AS storeName, s.userId AS storeUserId, su.phone AS storePhone, u.id AS requesterId, u.name AS requesterName, u.phone AS requesterPhone, " +
    "qt.unitPrice, qt.brand, qt.deliveryTime " +
    "FROM `Order` o JOIN `QuoteRequest` q ON q.id = o.quoteRequestId JOIN `Store` s ON s.userId = o.toStoreId JOIN `User` su ON su.id = s.userId " +
    "JOIN `User` u ON u.id = o.fromUserId LEFT JOIN `Quote` qt ON qt.id = o.quoteId";
const LIST_OPEN = `${SELECT_REQUESTS} WHERE q.status = 'abierta' ORDER BY q.createdAt DESC LIMIT ? OFFSET ?`;
const LIST_ORDERED = `${SELECT_REQUESTS} WHERE q.status = 'con_pedido' ORDER BY q.createdAt DESC LIMIT ? OFFSET ?`;
const LIST_ALL = `${SELECT_REQUESTS} ORDER BY q.createdAt DESC LIMIT ? OFFSET ?`;
function rows(result) {
    return Array.isArray(result[0]) ? result[0] : [];
}
const text = (value) => (value === null || value === undefined ? null : String(value));
const num = (value) => (value === null || value === undefined ? null : Number(value));
const label = (r) => {
    const parts = [r.make, r.model, r.year].filter((v) => v !== null && v !== undefined && v !== "");
    return parts.length > 0 ? parts.join(" ") : null;
};
function toRequest(r) {
    return {
        id: String(r.id),
        number: Number(r.number),
        status: String(r.status),
        requesterId: String(r.requesterId),
        requesterName: String(r.requesterName),
        requesterPhone: String(r.requesterPhone),
        requesterRole: String(r.requesterRole),
        vehicleId: text(r.vehicleId),
        vehicleLabel: label(r),
        plate: text(r.plate),
        workOrderId: text(r.workOrderId),
        partName: String(r.partName),
        partCode: text(r.partCode),
        quantity: Number(r.quantity ?? 1),
        city: String(r.city),
        notes: text(r.notes),
        closeReason: text(r.closeReason),
        createdAt: r.createdAt,
    };
}
function toQuote(r) {
    return {
        id: String(r.id),
        requestId: String(r.requestId),
        storeId: String(r.storeId),
        storeName: String(r.storeName),
        storeCity: String(r.storeCity),
        storeUserId: String(r.storeUserId),
        storePhone: String(r.storePhone),
        status: String(r.status),
        unitPrice: num(r.unitPrice),
        brand: text(r.brand),
        availability: text(r.availability),
        warrantyDays: num(r.warrantyDays),
        deliveryTime: text(r.deliveryTime),
        validDays: num(r.validDays),
        notes: text(r.notes),
        lossReason: text(r.lossReason),
        respondedAt: r.respondedAt ?? null,
    };
}
function toOrder(r) {
    return {
        id: String(r.id),
        stage: String(r.stage ?? "confirmado"),
        status: String(r.status),
        total: Number(r.total ?? 0),
        cancelReason: text(r.cancelReason),
        createdAt: r.createdAt,
        quoteRequestId: String(r.quoteRequestId),
        quoteId: text(r.quoteId),
        requestNumber: Number(r.requestNumber),
        partName: String(r.partName),
        quantity: Number(r.quantity ?? 1),
        storeId: String(r.storeId),
        storeName: String(r.storeName),
        storeUserId: String(r.storeUserId),
        storePhone: String(r.storePhone),
        requesterId: String(r.requesterId),
        requesterName: String(r.requesterName),
        requesterPhone: String(r.requesterPhone),
        unitPrice: num(r.unitPrice),
        brand: text(r.brand),
        deliveryTime: text(r.deliveryTime),
    };
}
export class MysqlQuoteStore {
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
    verifiedStores(city) {
        // Sin los almacenes sancionados (docs/35 M5); tolera que la tabla Sanction no exista aún.
        const base = "SELECT id, name, city, zone, categories, delivery FROM `Store` st WHERE verificationStatus = 'verified' " +
            "AND (? = '' OR LOWER(TRIM(city)) = LOWER(TRIM(?))) ";
        return this.run(async (conn) => rows(await conn.query(`${base}${NOT_SANCTIONED("st")}ORDER BY name LIMIT 200`, [city.trim(), city.trim()]).catch((err) => {
            if (err.code !== "ER_NO_SUCH_TABLE")
                throw err;
            return conn.query(`${base}ORDER BY name LIMIT 200`, [city.trim(), city.trim()]);
        })).map((r) => ({
            id: String(r.id),
            name: String(r.name),
            city: String(r.city),
            zone: text(r.zone),
            categories: text(r.categories),
            delivery: !!Number(r.delivery ?? 0),
        })));
    }
    async createRequest(input) {
        const attempt = () => this.transaction(async (conn) => {
            const id = String(rows(await conn.query("SELECT UUID() AS id"))[0]?.id);
            const next = Number(rows(await conn.query("SELECT COALESCE(MAX(number), 0) + 1 AS n FROM `QuoteRequest` FOR UPDATE"))[0]?.n ?? 1);
            await conn.query("INSERT INTO `QuoteRequest` (id, number, requesterId, vehicleId, workOrderId, partName, partCode, quantity, city, notes, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'abierta', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, next, input.requesterId, input.vehicleId, input.workOrderId, input.partName, input.partCode, input.quantity, input.city, input.notes]);
            for (const storeId of input.storeIds) {
                await conn.query("INSERT INTO `Quote` (id, requestId, storeId, status, createdAt) VALUES (UUID(), ?, ?, 'invitado', CURRENT_TIMESTAMP(3))", [id, storeId]);
            }
            return id;
        });
        try {
            return await attempt();
        }
        catch (err) {
            if (err.code === "ER_DUP_ENTRY")
                return attempt();
            throw err;
        }
    }
    getRequest(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT_REQUESTS} WHERE q.id = ? LIMIT 1`, [id]))[0];
            if (!row)
                return null;
            const quotes = rows(await conn.query(`${SELECT_QUOTES} WHERE qt.requestId = ? ORDER BY s.name`, [id])).map(toQuote);
            const order = rows(await conn.query(`${SELECT_ORDERS} WHERE o.quoteRequestId = ? ORDER BY o.createdAt DESC LIMIT 1`, [id]))[0];
            return { request: toRequest(row), quotes, order: order ? toOrder(order) : null };
        });
    }
    listRequests(filter, page) {
        return this.run(async (conn) => {
            const sql = filter === "abiertas" ? LIST_OPEN : filter === "con_pedido" ? LIST_ORDERED : LIST_ALL;
            const items = rows(await conn.query(sql, [PAGE_SIZE, (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE])).map(toRequest);
            return { items, page, pageSize: PAGE_SIZE };
        });
    }
    listForUser(userId) {
        return this.run(async (conn) => {
            const requests = rows(await conn.query(`${SELECT_REQUESTS} WHERE q.requesterId = ? ORDER BY q.createdAt DESC LIMIT 20`, [userId])).map(toRequest);
            const storeQuotes = rows(await conn.query(`${SELECT_QUOTES.replace(" FROM `Quote` qt", ", q.number AS requestNumber, q.partName, q.status AS requestStatus FROM `Quote` qt")} JOIN \`QuoteRequest\` q ON q.id = qt.requestId WHERE s.userId = ? ORDER BY q.createdAt DESC LIMIT 20`, [userId])).map((r) => ({ ...toQuote(r), requestNumber: Number(r.requestNumber), partName: String(r.partName), requestStatus: String(r.requestStatus) }));
            const orders = rows(await conn.query(`${SELECT_ORDERS} WHERE o.fromUserId = ? OR s.userId = ? ORDER BY o.createdAt DESC LIMIT 20`, [userId, userId])).map(toOrder);
            return { requests, storeQuotes, orders };
        });
    }
    saveQuote(requestId, quoteId, response) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Quote` qt JOIN `QuoteRequest` q ON q.id = qt.requestId SET qt.status = ?, qt.unitPrice = ?, qt.brand = ?, qt.availability = ?, qt.warrantyDays = ?, qt.deliveryTime = ?, qt.validDays = ?, qt.notes = ?, qt.respondedAt = CURRENT_TIMESTAMP(3) WHERE qt.id = ? AND qt.requestId = ? AND q.status = 'abierta'", [
                response.status,
                response.unitPrice,
                response.brand,
                response.availability,
                response.warrantyDays,
                response.deliveryTime,
                response.validDays,
                response.notes,
                quoteId,
                requestId,
            ]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    choose(requestId, quoteId) {
        return this.transaction(async (conn) => {
            const request = rows(await conn.query("SELECT requesterId, partName, quantity, status FROM `QuoteRequest` WHERE id = ? FOR UPDATE", [requestId]))[0];
            if (!request || request.status !== "abierta")
                return null;
            const quote = rows(await conn.query("SELECT qt.storeId, qt.unitPrice, qt.status, s.userId AS storeUserId FROM `Quote` qt JOIN `Store` s ON s.id = qt.storeId WHERE qt.id = ? AND qt.requestId = ? FOR UPDATE", [quoteId, requestId]))[0];
            if (!quote || quote.status !== "cotizado" || quote.unitPrice === null)
                return null;
            const quantity = Number(request.quantity ?? 1);
            const unitPrice = Number(quote.unitPrice);
            const total = Math.round(unitPrice * quantity * 100) / 100;
            const orderId = String(rows(await conn.query("SELECT UUID() AS id"))[0]?.id);
            await conn.query("UPDATE `Quote` SET status = 'elegida' WHERE id = ?", [quoteId]);
            await conn.query("UPDATE `Quote` SET status = 'descartada' WHERE requestId = ? AND id <> ? AND status IN ('invitado', 'cotizado')", [requestId, quoteId]);
            await conn.query("UPDATE `QuoteRequest` SET status = 'con_pedido', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [requestId]);
            await conn.query("INSERT INTO `Order` (id, orderType, fromUserId, toStoreId, status, createdAt, quoteRequestId, quoteId, stage, total, updatedAt) VALUES (?, 'repuesto', ?, ?, 'requested', CURRENT_TIMESTAMP(3), ?, ?, 'confirmado', ?, CURRENT_TIMESTAMP(3))", 
            // En el esquema original, Order.toStoreId referencia al usuario titular del almacén (FK a User).
            [orderId, request.requesterId, quote.storeUserId, requestId, quoteId, total]);
            await conn.query("INSERT INTO `OrderLine` (id, orderId, productId, itemName, qty, unitPrice) VALUES (UUID(), ?, NULL, ?, ?, ?)", [
                orderId,
                String(request.partName).slice(0, 191),
                quantity,
                unitPrice,
            ]);
            return orderId;
        });
    }
    closeRequest(requestId, reason) {
        return this.transaction(async (conn) => {
            const [result] = await conn.query("UPDATE `QuoteRequest` SET status = 'sin_pedido', closeReason = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'abierta'", [reason, requestId]);
            if (Number(result.affectedRows ?? 0) === 0)
                return false;
            await conn.query("UPDATE `Quote` SET status = 'descartada' WHERE requestId = ? AND status IN ('invitado', 'cotizado')", [requestId]);
            return true;
        });
    }
    setLossReason(requestId, quoteId, reason) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Quote` SET lossReason = ? WHERE id = ? AND requestId = ? AND status = 'descartada'", [
                reason,
                quoteId,
                requestId,
            ]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    setOrderStage(orderId, expected, next, cancelReason) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Order` SET stage = ?, status = ?, cancelReason = COALESCE(?, cancelReason), updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND stage = ?", [next, ORDER_STATUS_FOR_STAGE[next], cancelReason, orderId, expected]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
}
//# sourceMappingURL=quote-store.js.map