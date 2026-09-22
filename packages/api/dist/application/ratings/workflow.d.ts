export type RatingKind = "taller" | "almacen";
export declare const SCORES: Array<{
    value: number;
    label: string;
}>;
/** Por debajo de esto conviene revisar el caso: es la señal de docs/35 M4. */
export declare const DISPUTE_THRESHOLD = 2;
export declare function parseScore(input: unknown): number | null;
export declare function needsReview(score: number): boolean;
export interface RatingRecord {
    score: number;
    hiddenAt?: Date | string | null;
}
/** Promedio con un decimal sobre las reseñas visibles; 0 si no hay ninguna. */
export declare function average(ratings: RatingRecord[]): number;
export declare function stars(score: number): string;
/** Mensaje para pedirle la calificación al dueño cuando se cierra el trabajo. */
export declare function askMessage(input: {
    shopName: string;
    code: string;
}): string;
/** Respuesta al dueño según lo que calificó. */
export declare function thanksMessage(score: number): string;
//# sourceMappingURL=workflow.d.ts.map