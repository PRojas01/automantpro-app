const PAGE_SIZE = 25;
function rows(result) {
    return Array.isArray(result[0]) ? result[0] : [];
}
function parseServices(raw) {
    if (Array.isArray(raw))
        return raw.map(String);
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
function pendingItem(kind) {
    return (r) => ({
        kind,
        id: String(r.id),
        userId: String(r.userId),
        name: String(r.name),
        city: String(r.city),
        ruc: r.ruc ? String(r.ruc) : null,
        createdAt: r.createdAt,
    });
}
export class MysqlRegistrationStore {
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
    async uuid(conn) {
        return String(rows(await conn.query("SELECT UUID() AS id"))[0]?.id);
    }
    async insertUser(conn, user, role) {
        const id = await this.uuid(conn);
        await conn.query("INSERT INTO `User` (id, email, phone, passwordHash, role, name, locale, city, consentAt, consentVersion, source, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'es', ?, CURRENT_TIMESTAMP(3), ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, user.email, user.phone, user.passwordHash, role, user.name, user.city, user.consentVersion, user.source, user.notes]);
        return id;
    }
    async insertVehicle(conn, userId, v) {
        const id = await this.uuid(conn);
        await conn.query("INSERT INTO `Vehicle` (id, userId, make, model, year, currentKm, vehicleClass, fuel, plate, usageProfile, remindersOptIn, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, userId, v.make, v.model, v.year, v.currentKm, v.vehicleClass, v.fuel, v.plate, v.usageProfile, v.remindersOptIn]);
        return id;
    }
    createOwner(user, vehicle) {
        return this.transaction(async (conn) => {
            const userId = await this.insertUser(conn, user, "dueno");
            await this.insertVehicle(conn, userId, vehicle);
            return userId;
        });
    }
    createShop(user, shop) {
        return this.transaction(async (conn) => {
            const userId = await this.insertUser(conn, user, "taller");
            const id = await this.uuid(conn);
            await conn.query("INSERT INTO `Shop` (id, userId, name, address, city, zone, ruc, hours, contactName, email, specialties, verificationStatus, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, userId, shop.name, shop.address, shop.city, shop.zone, shop.ruc, shop.hours, shop.contactName, shop.email, JSON.stringify(shop.services)]);
            return userId;
        });
    }
    createStore(user, store) {
        return this.transaction(async (conn) => {
            const userId = await this.insertUser(conn, user, "almacen");
            const id = await this.uuid(conn);
            await conn.query("INSERT INTO `Store` (id, userId, name, address, city, zone, ruc, hours, contactName, email, categories, delivery, verificationStatus, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, userId, store.name, store.address, store.city, store.zone, store.ruc, store.hours, store.contactName, store.email, store.categories, store.delivery]);
            return userId;
        });
    }
    addVehicle(userId, vehicle) {
        return this.run((conn) => this.insertVehicle(conn, userId, vehicle));
    }
    searchUsers(query, page) {
        return this.run(async (conn) => {
            const q = query.trim();
            const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
            const digits = q.replace(/\D/g, "");
            const likePhone = digits ? `%${digits}%` : like;
            const items = rows(await conn.query("SELECT id, name, role, phone, city, createdAt FROM `User` WHERE deletedAt IS NULL AND role <> 'admin' AND (? = '' OR name LIKE ? OR phone LIKE ?) ORDER BY createdAt DESC LIMIT ? OFFSET ?", [q, like, likePhone, PAGE_SIZE, (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE]));
            return { items, page, pageSize: PAGE_SIZE };
        });
    }
    getUserDetail(id) {
        return this.run(async (conn) => {
            const user = rows(await conn.query("SELECT id, name, role, phone, email, city, consentAt, consentVersion, source, notes, createdAt FROM `User` WHERE id = ? AND deletedAt IS NULL LIMIT 1", [id]))[0];
            if (!user)
                return null;
            const vehicles = rows(await conn.query("SELECT id, make, model, year, currentKm, vehicleClass, fuel, plate, usageProfile, remindersOptIn, createdAt FROM `Vehicle` WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt", [id]));
            const shopRow = rows(await conn.query("SELECT id, name, address, city, zone, ruc, hours, contactName, email, specialties, verificationStatus, createdAt FROM `Shop` WHERE userId = ? LIMIT 1", [id]))[0];
            const store = rows(await conn.query("SELECT id, name, address, city, zone, ruc, hours, contactName, email, categories, delivery, verificationStatus, createdAt FROM `Store` WHERE userId = ? LIMIT 1", [id]))[0];
            return {
                user,
                vehicles,
                shop: shopRow ? { ...shopRow, services: parseServices(shopRow.specialties) } : null,
                store: store ?? null,
            };
        });
    }
    pendingVerifications() {
        return this.run(async (conn) => {
            const shops = rows(await conn.query("SELECT id, userId, name, city, ruc, createdAt FROM `Shop` WHERE verificationStatus = 'pending' ORDER BY createdAt LIMIT 100")).map(pendingItem("shop"));
            const stores = rows(await conn.query("SELECT id, userId, name, city, ruc, createdAt FROM `Store` WHERE verificationStatus = 'pending' ORDER BY createdAt LIMIT 100")).map(pendingItem("store"));
            return [...shops, ...stores].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
    }
    setVerification(kind, id, status) {
        return this.run(async (conn) => {
            const [result] = kind === "shop"
                ? await conn.query("UPDATE `Shop` SET verificationStatus = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [status, id])
                : await conn.query("UPDATE `Store` SET verificationStatus = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [status, id]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    recentUsers(limit) {
        return this.run(async (conn) => rows(await conn.query("SELECT id, name, role, city, createdAt FROM `User` WHERE deletedAt IS NULL AND role <> 'admin' ORDER BY createdAt DESC LIMIT ?", [limit])));
    }
    pendingCount() {
        return this.run(async (conn) => {
            const shops = Number(rows(await conn.query("SELECT COUNT(*) AS n FROM `Shop` WHERE verificationStatus = 'pending'"))[0]?.n ?? 0);
            const stores = Number(rows(await conn.query("SELECT COUNT(*) AS n FROM `Store` WHERE verificationStatus = 'pending'"))[0]?.n ?? 0);
            return shops + stores;
        });
    }
}
//# sourceMappingURL=registration-store.js.map