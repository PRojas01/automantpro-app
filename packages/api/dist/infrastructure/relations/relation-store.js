import { RELATION_OPEN_STATUSES } from "../../application/relations/workflow.js";
const PAGE_SIZE = 25;
const OPEN = RELATION_OPEN_STATUSES.map(() => "?").join(", ");
function rows(result) {
    const [list] = result;
    return Array.isArray(list) ? list : [];
}
const str = (value) => (value === null || value === undefined ? null : String(value));
const bool = (value) => value === 1 || value === true || value === "1";
const SELECT_RELATION = "SELECT r.*, (SELECT GROUP_CONCAT(u.name ORDER BY p.role SEPARATOR ' ↔ ') FROM `RelationshipParty` p " +
    "JOIN `User` u ON u.id = p.userId WHERE p.relationshipId = r.id) AS parties FROM `Relationship` r";
function toRelation(row) {
    return {
        id: String(row.id),
        number: Number(row.number ?? 0),
        kind: String(row.kind),
        status: String(row.status),
        channel: String(row.channel),
        groupInviteUrl: str(row.groupInviteUrl),
        originType: String(row.originType),
        originId: str(row.originId),
        subject: str(row.subject),
        relayPaused: bool(row.relayPaused),
        lastMessageAt: row.lastMessageAt ?? null,
        waitingSince: row.waitingSince ?? null,
        createdAt: row.createdAt,
        closedAt: row.closedAt ?? null,
        closeReason: str(row.closeReason),
        parties: str(row.parties) ?? "",
    };
}
function toDispute(row) {
    return {
        id: String(row.id),
        number: Number(row.number ?? 0),
        relationshipId: str(row.relationshipId),
        relationNumber: row.relationNumber === null || row.relationNumber === undefined ? null : Number(row.relationNumber),
        claimantUserId: str(row.claimantUserId),
        claimantName: str(row.claimantName),
        againstUserId: str(row.againstUserId),
        againstName: str(row.againstName),
        reason: String(row.reason ?? ""),
        status: String(row.status),
        resolution: str(row.resolution),
        createdAt: row.createdAt,
        resolvedAt: row.resolvedAt ?? null,
    };
}
function toSanction(row) {
    return {
        id: String(row.id),
        userId: String(row.userId),
        userName: str(row.userName),
        level: String(row.level),
        reason: String(row.reason ?? ""),
        relationshipId: str(row.relationshipId),
        disputeId: str(row.disputeId),
        startsAt: row.startsAt,
        endsAt: row.endsAt ?? null,
        liftedAt: row.liftedAt ?? null,
        liftReason: str(row.liftReason),
        createdAt: row.createdAt,
    };
}
export class MysqlRelationStore {
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
    async nextNumber(conn, table) {
        const row = rows(await conn.query(`SELECT COALESCE(MAX(\`number\`), 0) + 1 AS n FROM \`${table}\``))[0];
        return Number(row?.n ?? 1);
    }
    ensureForOrigin(input) {
        return this.run(async (conn) => {
            const existing = rows(await conn.query("SELECT id FROM `Relationship` WHERE originType = ? AND originId = ? LIMIT 1", [input.originType, input.originId]))[0];
            if (existing)
                return String(existing.id);
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            const number = await this.nextNumber(conn, "Relationship");
            await conn.query("INSERT INTO `Relationship` (id, `number`, kind, status, channel, originType, originId, subject, createdBy, createdAt, updatedAt) " +
                "VALUES (?, ?, ?, 'activa', 'mediado', ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, number, input.kind, input.originType, input.originId, input.subject, input.createdBy]);
            for (const party of input.parties) {
                await conn.query("INSERT INTO `RelationshipParty` (id, relationshipId, userId, role, createdAt) VALUES (UUID(), ?, ?, ?, CURRENT_TIMESTAMP(3))", [id, party.userId, party.role]);
            }
            return id;
        });
    }
    list(filter, page, waitingHours = 24) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            let where = "";
            const params = [];
            if (filter === "abiertas") {
                where = `WHERE r.status IN (${OPEN})`;
                params.push(...RELATION_OPEN_STATUSES);
            }
            else if (filter === "esperando") {
                where = `WHERE r.status IN (${OPEN}) AND r.waitingSince IS NOT NULL AND r.waitingSince <= DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? HOUR)`;
                params.push(...RELATION_OPEN_STATUSES, Math.max(1, Math.floor(waitingHours)));
            }
            else if (filter === "disputa") {
                where = "WHERE r.status = 'en_disputa'";
            }
            else if (filter === "cerradas") {
                where = "WHERE r.status IN ('cerrada', 'bloqueada')";
            }
            const items = rows(await conn.query(`${SELECT_RELATION} ${where} ORDER BY r.waitingSince IS NULL, r.waitingSince ASC, r.createdAt DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`, params)).map(toRelation);
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    get(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query(`${SELECT_RELATION} WHERE r.id = ? LIMIT 1`, [id]))[0];
            if (!row)
                return null;
            const parties = rows(await conn.query("SELECT p.id, p.userId, p.role, p.consentShareContact, p.consentAt, p.mutedAt, u.name, u.phone FROM `RelationshipParty` p " +
                "JOIN `User` u ON u.id = p.userId WHERE p.relationshipId = ? ORDER BY p.role ASC", [id])).map((p) => ({
                id: String(p.id),
                userId: String(p.userId),
                role: String(p.role),
                name: String(p.name ?? ""),
                phone: str(p.phone),
                consentShareContact: bool(p.consentShareContact),
                consentAt: p.consentAt ?? null,
                mutedAt: p.mutedAt ?? null,
            }));
            const messages = rows(await conn.query("SELECT m.id, m.fromUserId, m.toUserId, m.body, m.kind, m.relayedAt, m.flagged, m.createdAt, " +
                "f.name AS fromName, t.name AS toName FROM `RelationshipMessage` m " +
                "LEFT JOIN `User` f ON f.id = m.fromUserId LEFT JOIN `User` t ON t.id = m.toUserId " +
                "WHERE m.relationshipId = ? ORDER BY m.createdAt ASC LIMIT 200", [id])).map((m) => ({
                id: String(m.id),
                fromUserId: str(m.fromUserId),
                toUserId: str(m.toUserId),
                fromName: str(m.fromName),
                toName: str(m.toName),
                body: String(m.body ?? ""),
                kind: String(m.kind),
                relayedAt: m.relayedAt ?? null,
                flagged: bool(m.flagged),
                createdAt: m.createdAt,
            }));
            const disputes = rows(await conn.query("SELECT d.*, r.`number` AS relationNumber, c.name AS claimantName, a.name AS againstName FROM `Dispute` d " +
                "LEFT JOIN `Relationship` r ON r.id = d.relationshipId LEFT JOIN `User` c ON c.id = d.claimantUserId " +
                "LEFT JOIN `User` a ON a.id = d.againstUserId WHERE d.relationshipId = ? ORDER BY d.createdAt DESC", [id])).map(toDispute);
            return { relation: toRelation(row), parties, messages, disputes };
        });
    }
    forUser(userId) {
        return this.run(async (conn) => rows(await conn.query(`${SELECT_RELATION} JOIN \`RelationshipParty\` mp ON mp.relationshipId = r.id AND mp.userId = ? ORDER BY r.createdAt DESC LIMIT 20`, [userId])).map(toRelation));
    }
    addMessage(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            await conn.query("INSERT INTO `RelationshipMessage` (id, relationshipId, fromUserId, toUserId, body, kind, relayedAt, createdBy, createdAt) " +
                `VALUES (?, ?, ?, ?, ?, ?, ${input.relayed ? "CURRENT_TIMESTAMP(3)" : "NULL"}, ?, CURRENT_TIMESTAMP(3))`, [id, input.relationshipId, input.fromUserId, input.toUserId, input.body, input.kind, input.createdBy]);
            // Espera respuesta quien recibió el mensaje; si lo escribió el panel, no hay espera.
            await conn.query("UPDATE `Relationship` SET lastMessageAt = CURRENT_TIMESTAMP(3), waitingSince = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [input.toUserId ? new Date() : null, input.relationshipId]);
            return id;
        });
    }
    setStatus(id, from, to, reason) {
        return this.run(async (conn) => {
            const closing = to === "cerrada" || to === "bloqueada";
            const [result] = await conn.query("UPDATE `Relationship` SET status = ?, closeReason = ?, closedAt = " +
                (closing ? "CURRENT_TIMESTAMP(3)" : "NULL") +
                ", waitingSince = " +
                (closing ? "NULL" : "waitingSince") +
                ", updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = ?", [to, reason, id, from]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    setRelayPaused(id, paused) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `Relationship` SET relayPaused = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [paused ? 1 : 0, id]);
        });
    }
    setConsent(relationshipId, userId, consent) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `RelationshipParty` SET consentShareContact = ?, consentAt = " +
                (consent ? "CURRENT_TIMESTAMP(3)" : "NULL") +
                " WHERE relationshipId = ? AND userId = ?", [consent ? 1 : 0, relationshipId, userId]);
        });
    }
    approveGroup(id, inviteUrl, approvedBy) {
        return this.run(async (conn) => {
            await conn.query("UPDATE `Relationship` SET channel = ?, groupInviteUrl = ?, groupApprovedBy = ?, groupApprovedAt = " +
                (inviteUrl ? "CURRENT_TIMESTAMP(3)" : "NULL") +
                ", updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [inviteUrl ? "grupo" : "mediado", inviteUrl, inviteUrl ? approvedBy : null, id]);
        });
    }
    openDispute(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            const number = await this.nextNumber(conn, "Dispute");
            await conn.query("INSERT INTO `Dispute` (id, `number`, relationshipId, openedBy, claimantUserId, againstUserId, reason, status, createdAt, updatedAt) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, 'abierta', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))", [id, number, input.relationshipId, input.openedBy, input.claimantUserId, input.againstUserId, input.reason]);
            if (input.relationshipId) {
                await conn.query("UPDATE `Relationship` SET status = 'en_disputa', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ? AND status IN ('propuesta', 'activa')", [input.relationshipId]);
            }
            return id;
        });
    }
    listDisputes(status, page) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            const where = status === "todas" ? "" : "WHERE d.status = ?";
            const params = status === "todas" ? [] : [status];
            const items = rows(await conn.query("SELECT d.*, r.`number` AS relationNumber, c.name AS claimantName, a.name AS againstName FROM `Dispute` d " +
                "LEFT JOIN `Relationship` r ON r.id = d.relationshipId LEFT JOIN `User` c ON c.id = d.claimantUserId " +
                `LEFT JOIN \`User\` a ON a.id = d.againstUserId ${where} ORDER BY d.createdAt DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`, params)).map(toDispute);
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    getDispute(id) {
        return this.run(async (conn) => {
            const row = rows(await conn.query("SELECT d.*, r.`number` AS relationNumber, c.name AS claimantName, a.name AS againstName FROM `Dispute` d " +
                "LEFT JOIN `Relationship` r ON r.id = d.relationshipId LEFT JOIN `User` c ON c.id = d.claimantUserId " +
                "LEFT JOIN `User` a ON a.id = d.againstUserId WHERE d.id = ? LIMIT 1", [id]))[0];
            return row ? toDispute(row) : null;
        });
    }
    resolveDispute(id, status, resolution, resolvedBy) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Dispute` SET status = ?, resolution = ?, resolvedBy = ?, resolvedAt = CURRENT_TIMESTAMP(3), updatedAt = CURRENT_TIMESTAMP(3) " +
                "WHERE id = ? AND status IN ('abierta', 'en_revision')", [status, resolution, resolvedBy, id]);
            const changed = Number(result.affectedRows ?? 0) > 0;
            if (changed) {
                // Al resolverla, la relación vuelve a estar activa salvo que se haya cerrado a mano.
                await conn.query("UPDATE `Relationship` SET status = 'activa', updatedAt = CURRENT_TIMESTAMP(3) WHERE id = " +
                    "(SELECT relationshipId FROM `Dispute` WHERE id = ?) AND status = 'en_disputa'", [id]);
            }
            return changed;
        });
    }
    addSanction(input) {
        return this.run(async (conn) => {
            const created = rows(await conn.query("SELECT UUID() AS id"))[0];
            const id = String(created?.id);
            await conn.query("INSERT INTO `Sanction` (id, userId, level, reason, relationshipId, disputeId, startsAt, endsAt, createdBy, createdAt) " +
                "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?, ?, CURRENT_TIMESTAMP(3))", [id, input.userId, input.level, input.reason, input.relationshipId, input.disputeId, input.endsAt, input.createdBy]);
            return id;
        });
    }
    listSanctions(page) {
        const offset = (Math.max(1, Math.floor(page)) - 1) * PAGE_SIZE;
        return this.run(async (conn) => {
            const items = rows(await conn.query("SELECT s.*, u.name AS userName FROM `Sanction` s JOIN `User` u ON u.id = s.userId " +
                `ORDER BY s.createdAt DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`)).map(toSanction);
            return { items, page: Math.max(1, Math.floor(page)), pageSize: PAGE_SIZE };
        });
    }
    sanctionsForUser(userId) {
        return this.run(async (conn) => rows(await conn.query("SELECT s.*, u.name AS userName FROM `Sanction` s JOIN `User` u ON u.id = s.userId WHERE s.userId = ? ORDER BY s.createdAt DESC LIMIT 50", [userId])).map(toSanction));
    }
    liftSanction(id, reason, liftedBy) {
        return this.run(async (conn) => {
            const [result] = await conn.query("UPDATE `Sanction` SET liftedAt = CURRENT_TIMESTAMP(3), liftedBy = ?, liftReason = ? WHERE id = ? AND liftedAt IS NULL", [liftedBy, reason, id]);
            return Number(result.affectedRows ?? 0) > 0;
        });
    }
    searchBlockedUserIds() {
        return this.run(async (conn) => rows(await conn.query("SELECT DISTINCT userId FROM `Sanction` WHERE liftedAt IS NULL AND startsAt <= UTC_TIMESTAMP(3) " +
            "AND (endsAt IS NULL OR endsAt > UTC_TIMESTAMP(3)) AND level IN ('suspension_busquedas', 'suspension', 'baja')")).map((r) => String(r.userId)));
    }
}
//# sourceMappingURL=relation-store.js.map