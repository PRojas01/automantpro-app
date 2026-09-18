export type PlanKey = "gratis" | "prueba" | "premium";
export type SubscriptionStatus = "pendiente" | "activa" | "rechazada" | "vencida" | "cancelada";
export type PaymentMethod = "transferencia" | "efectivo" | "deposito" | "cortesia" | "otro";
export declare const PLAN_LABELS: Record<PlanKey, string>;
export declare const STATUS_LABELS: Record<SubscriptionStatus, string>;
export declare const PAYMENT_METHODS: Array<[PaymentMethod, string]>;
/** Lo que cada plan habilita (docs/42 §2). */
export type Feature = "plan_mantenimiento" | "talleres_cercanos" | "talleres_verificados" | "cotizaciones" | "garantia" | "historial_export";
export declare const FEATURE_LABELS: Record<Feature, string>;
export declare function allows(plan: PlanKey, feature: Feature): boolean;
/**
 * Límites del plan gratuito por perfil (docs/42 §3). La idea es que todos puedan usar el sistema
 * —eso construye la base de usuarios— y que el plan pagado quite el techo, no la utilidad.
 */
export interface FreeLimits {
    /** Qué se cuenta y cuánto se permite al mes en el plan gratuito. */
    vehicles?: number;
    appointmentsPerMonth?: number;
    workOrdersPerMonth?: number;
    quotesPerMonth?: number;
}
export declare const FREE_LIMITS: Record<string, FreeLimits>;
export declare const LIMIT_LABELS: Record<keyof FreeLimits, string>;
export interface UsageCount {
    vehicles?: number;
    appointmentsPerMonth?: number;
    workOrdersPerMonth?: number;
    quotesPerMonth?: number;
}
export interface LimitState {
    key: keyof FreeLimits;
    label: string;
    used: number;
    limit: number;
    /** Ya llegó al tope: el operador debe ofrecer el plan pagado. */
    reached: boolean;
}
/** Estado de los límites del plan gratuito para un perfil; vacío si el plan es pagado. */
export declare function limitsFor(plan: PlanKey, role: string, usage: UsageCount): LimitState[];
/** Mensaje corto para ofrecer el plan pagado cuando alguien llegó a un tope. */
export declare function upgradeMessage(role: string, limit: LimitState): string;
export interface SubscriptionRecord {
    plan: string;
    status: string;
    startsAt: Date | string;
    endsAt: Date | string | null;
}
/** Una suscripción cuenta si está verificada, ya empezó y todavía no vence. */
export declare function isRunning(sub: SubscriptionRecord, now?: Date): boolean;
/** Plan vigente de una persona: premium gana sobre prueba, y prueba sobre gratis. */
export declare function effectivePlan(subs: SubscriptionRecord[], now?: Date): PlanKey;
/** Suscripción vigente que manda, para mostrar su vencimiento. */
export declare function currentSubscription<T extends SubscriptionRecord>(subs: T[], now?: Date): T | null;
export declare function daysLeft(endsAt: Date | string | null, now?: Date): number | null;
/** Fin del período según los meses pagados; null cuando no vence. */
export declare function periodEnd(months: number, from?: Date): Date | null;
/** Monto con hasta dos decimales; null si no es un número válido de dinero. */
export declare function parseAmount(input: unknown): number | null;
export declare const subscriptionCode: (number: number) => string;
/**
 * Talleres cercanos para quien no tiene plan pagado: se entrega un enlace de búsqueda de Google
 * Maps, no una lista copiada. Así se cumple con los términos del mapa y no cuesta por consulta.
 */
export declare function nearbyWorkshopsLink(city: string, reference?: string): string;
export declare function nearbyWorkshopsMessage(city: string, reference?: string): string;
//# sourceMappingURL=plans.d.ts.map