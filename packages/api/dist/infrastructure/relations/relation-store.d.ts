import type { SqlConnection } from "../schema-setup/apply.js";
export interface RelationRow {
    id: string;
    number: number;
    kind: string;
    status: string;
    channel: string;
    groupInviteUrl: string | null;
    originType: string;
    originId: string | null;
    subject: string | null;
    relayPaused: boolean;
    lastMessageAt: Date | string | null;
    waitingSince: Date | string | null;
    createdAt: Date | string;
    closedAt: Date | string | null;
    closeReason: string | null;
    /** Nombres de las partes, para la lista. */
    parties: string;
}
export interface PartyRow {
    id: string;
    userId: string;
    role: string;
    name: string;
    phone: string | null;
    consentShareContact: boolean;
    consentAt: Date | string | null;
    mutedAt: Date | string | null;
}
export interface MessageRow {
    id: string;
    fromUserId: string | null;
    toUserId: string | null;
    fromName: string | null;
    toName: string | null;
    body: string;
    kind: string;
    relayedAt: Date | string | null;
    flagged: boolean;
    createdAt: Date | string;
}
export interface DisputeRow {
    id: string;
    number: number;
    relationshipId: string | null;
    relationNumber: number | null;
    claimantUserId: string | null;
    claimantName: string | null;
    againstUserId: string | null;
    againstName: string | null;
    reason: string;
    status: string;
    resolution: string | null;
    createdAt: Date | string;
    resolvedAt: Date | string | null;
}
export interface SanctionRow {
    id: string;
    userId: string;
    userName: string | null;
    level: string;
    reason: string;
    relationshipId: string | null;
    disputeId: string | null;
    startsAt: Date | string;
    endsAt: Date | string | null;
    liftedAt: Date | string | null;
    liftReason: string | null;
    createdAt: Date | string;
}
export interface RelationDetail {
    relation: RelationRow;
    parties: PartyRow[];
    messages: MessageRow[];
    disputes: DisputeRow[];
}
export type RelationFilter = "abiertas" | "esperando" | "disputa" | "cerradas" | "todas";
export interface Paged<T> {
    items: T[];
    page: number;
    pageSize: number;
}
export interface NewRelationParty {
    userId: string;
    role: string;
}
export interface RelationStore {
    /** Crea la relación del origen (turno, orden, cotización) o devuelve la existente. */
    ensureForOrigin(input: {
        kind: string;
        originType: string;
        originId: string;
        subject: string | null;
        parties: NewRelationParty[];
        createdBy: string | null;
    }): Promise<string>;
    list(filter: RelationFilter, page: number, waitingHours?: number): Promise<Paged<RelationRow>>;
    get(id: string): Promise<RelationDetail | null>;
    forUser(userId: string): Promise<RelationRow[]>;
    addMessage(input: {
        relationshipId: string;
        fromUserId: string | null;
        toUserId: string | null;
        body: string;
        kind: string;
        relayed: boolean;
        createdBy: string | null;
    }): Promise<string>;
    setStatus(id: string, from: string, to: string, reason: string | null): Promise<boolean>;
    setRelayPaused(id: string, paused: boolean): Promise<void>;
    setConsent(relationshipId: string, userId: string, consent: boolean): Promise<void>;
    approveGroup(id: string, inviteUrl: string | null, approvedBy: string | null): Promise<void>;
    openDispute(input: {
        relationshipId: string | null;
        claimantUserId: string | null;
        againstUserId: string | null;
        reason: string;
        openedBy: string | null;
    }): Promise<string>;
    listDisputes(status: string, page: number): Promise<Paged<DisputeRow>>;
    getDispute(id: string): Promise<DisputeRow | null>;
    resolveDispute(id: string, status: string, resolution: string, resolvedBy: string | null): Promise<boolean>;
    addSanction(input: {
        userId: string;
        level: string;
        reason: string;
        relationshipId: string | null;
        disputeId: string | null;
        endsAt: Date | null;
        createdBy: string | null;
    }): Promise<string>;
    listSanctions(page: number): Promise<Paged<SanctionRow>>;
    sanctionsForUser(userId: string): Promise<SanctionRow[]>;
    liftSanction(id: string, reason: string, liftedBy: string | null): Promise<boolean>;
    /** Usuarios con una sanción vigente que los saca de las búsquedas. */
    searchBlockedUserIds(): Promise<string[]>;
}
export declare class MysqlRelationStore implements RelationStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    private nextNumber;
    ensureForOrigin(input: {
        kind: string;
        originType: string;
        originId: string;
        subject: string | null;
        parties: NewRelationParty[];
        createdBy: string | null;
    }): Promise<string>;
    list(filter: RelationFilter, page: number, waitingHours?: number): Promise<Paged<RelationRow>>;
    get(id: string): Promise<RelationDetail | null>;
    forUser(userId: string): Promise<RelationRow[]>;
    addMessage(input: {
        relationshipId: string;
        fromUserId: string | null;
        toUserId: string | null;
        body: string;
        kind: string;
        relayed: boolean;
        createdBy: string | null;
    }): Promise<string>;
    setStatus(id: string, from: string, to: string, reason: string | null): Promise<boolean>;
    setRelayPaused(id: string, paused: boolean): Promise<void>;
    setConsent(relationshipId: string, userId: string, consent: boolean): Promise<void>;
    approveGroup(id: string, inviteUrl: string | null, approvedBy: string | null): Promise<void>;
    openDispute(input: {
        relationshipId: string | null;
        claimantUserId: string | null;
        againstUserId: string | null;
        reason: string;
        openedBy: string | null;
    }): Promise<string>;
    listDisputes(status: string, page: number): Promise<Paged<DisputeRow>>;
    getDispute(id: string): Promise<DisputeRow | null>;
    resolveDispute(id: string, status: string, resolution: string, resolvedBy: string | null): Promise<boolean>;
    addSanction(input: {
        userId: string;
        level: string;
        reason: string;
        relationshipId: string | null;
        disputeId: string | null;
        endsAt: Date | null;
        createdBy: string | null;
    }): Promise<string>;
    listSanctions(page: number): Promise<Paged<SanctionRow>>;
    sanctionsForUser(userId: string): Promise<SanctionRow[]>;
    liftSanction(id: string, reason: string, liftedBy: string | null): Promise<boolean>;
    searchBlockedUserIds(): Promise<string[]>;
}
//# sourceMappingURL=relation-store.d.ts.map