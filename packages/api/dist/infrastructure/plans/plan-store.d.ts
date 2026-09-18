import type { SqlConnection } from "../schema-setup/apply.js";
import { type PlanKey, type UsageCount } from "../../application/plans/plans.js";
export interface SubscriptionRow {
    id: string;
    number: number;
    userId: string;
    userName: string | null;
    userRole: string | null;
    plan: string;
    status: string;
    months: number | null;
    amountUsd: number | null;
    method: string | null;
    reference: string | null;
    notes: string | null;
    startsAt: Date | string;
    endsAt: Date | string | null;
    verifiedAt: Date | string | null;
    decisionReason: string | null;
    createdAt: Date | string;
}
export type SubscriptionFilter = "pendiente" | "activa" | "por_vencer" | "vencida" | "todas";
export interface PlanStore {
    create(input: {
        userId: string;
        plan: string;
        months: number | null;
        amountUsd: number | null;
        method: string | null;
        reference: string | null;
        notes: string | null;
        createdBy: string | null;
    }): Promise<string>;
    list(filter: SubscriptionFilter, page: number, soonDays?: number): Promise<{
        items: SubscriptionRow[];
        page: number;
        pageSize: number;
    }>;
    get(id: string): Promise<SubscriptionRow | null>;
    forUser(userId: string): Promise<SubscriptionRow[]>;
    /** Verifica el pago y activa el período; devuelve false si ya estaba decidida. */
    verify(id: string, months: number | null, verifiedBy: string | null): Promise<boolean>;
    reject(id: string, reason: string, verifiedBy: string | null): Promise<boolean>;
    cancel(id: string, reason: string, verifiedBy: string | null): Promise<boolean>;
    /** Marca como vencidas las suscripciones activas cuyo período terminó. */
    expireDue(): Promise<number>;
    /** Cuántos pagos esperan verificación, para el aviso del tablero. */
    pendingCount(): Promise<number>;
    planForUser(userId: string): Promise<PlanKey>;
    /** Uso del mes en curso, para comparar con los límites del plan gratuito. */
    usageForUser(userId: string): Promise<UsageCount>;
}
export declare class MysqlPlanStore implements PlanStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    create(input: {
        userId: string;
        plan: string;
        months: number | null;
        amountUsd: number | null;
        method: string | null;
        reference: string | null;
        notes: string | null;
        createdBy: string | null;
    }): Promise<string>;
    list(filter: SubscriptionFilter, page: number, soonDays?: number): Promise<{
        items: SubscriptionRow[];
        page: number;
        pageSize: number;
    }>;
    get(id: string): Promise<SubscriptionRow | null>;
    forUser(userId: string): Promise<SubscriptionRow[]>;
    verify(id: string, months: number | null, verifiedBy: string | null): Promise<boolean>;
    reject(id: string, reason: string, verifiedBy: string | null): Promise<boolean>;
    cancel(id: string, reason: string, verifiedBy: string | null): Promise<boolean>;
    expireDue(): Promise<number>;
    pendingCount(): Promise<number>;
    usageForUser(userId: string): Promise<UsageCount>;
    planForUser(userId: string): Promise<PlanKey>;
}
//# sourceMappingURL=plan-store.d.ts.map