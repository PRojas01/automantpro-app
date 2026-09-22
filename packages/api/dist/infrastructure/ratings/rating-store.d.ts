import type { SqlConnection } from "../schema-setup/apply.js";
export interface RatingRow {
    id: string;
    fromId: string;
    fromName: string | null;
    toId: string;
    score: number;
    comment: string | null;
    kind: string | null;
    workOrderId: string | null;
    hiddenAt: Date | string | null;
    hiddenReason: string | null;
    createdAt: Date | string;
}
export interface RatingStore {
    /** Guarda la calificación y actualiza el promedio de quien la recibe. */
    add(input: {
        fromId: string;
        toId: string;
        score: number;
        comment: string | null;
        kind: string;
        workOrderId: string | null;
        quoteRequestId: string | null;
    }): Promise<string>;
    /** Calificaciones recibidas por una entidad (usuario del taller o del almacén). */
    forUser(userId: string, limit?: number): Promise<RatingRow[]>;
    /** La calificación de un trabajo, si ya la dieron. */
    forWorkOrder(workOrderId: string): Promise<RatingRow | null>;
    hide(id: string, reason: string, hiddenBy: string | null): Promise<boolean>;
    show(id: string): Promise<boolean>;
    get(id: string): Promise<RatingRow | null>;
}
export declare class MysqlRatingStore implements RatingStore {
    private readonly connect;
    constructor(connect: () => Promise<SqlConnection>);
    private run;
    /** Recalcula promedio y cantidad de quien recibe, sobre las reseñas visibles. */
    private refresh;
    add(input: {
        fromId: string;
        toId: string;
        score: number;
        comment: string | null;
        kind: string;
        workOrderId: string | null;
        quoteRequestId: string | null;
    }): Promise<string>;
    forUser(userId: string, limit?: number): Promise<RatingRow[]>;
    forWorkOrder(workOrderId: string): Promise<RatingRow | null>;
    get(id: string): Promise<RatingRow | null>;
    hide(id: string, reason: string, hiddenBy: string | null): Promise<boolean>;
    show(id: string): Promise<boolean>;
}
//# sourceMappingURL=rating-store.d.ts.map