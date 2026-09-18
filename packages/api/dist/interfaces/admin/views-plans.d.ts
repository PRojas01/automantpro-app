import { type UsageCount, type PlanKey } from "../../application/plans/plans.js";
import type { SubscriptionRow } from "../../infrastructure/plans/plan-store.js";
import type { Flash } from "./views-setup.js";
/** Insignia del plan vigente, para usar en fichas y en Atender. */
export declare function planBadge(plan: PlanKey, endsAt?: Date | string | null): string;
export declare function plansListView(input: {
    csrf: string;
    filter: string;
    items: SubscriptionRow[];
    canDecide: boolean;
    pending: number;
    flash?: Flash;
}): string;
/** Tarjeta del plan en la ficha del usuario: estado actual, historial y alta de un pago. */
export declare function userPlanCard(userId: string, subs: SubscriptionRow[], csrf: string, canRegister: boolean, role?: string, usage?: UsageCount): string;
//# sourceMappingURL=views-plans.d.ts.map