import type { FastifyInstance } from "fastify";
export declare const API_STATUS: {
    readonly status: "ok";
    readonly service: "AutoMantPro API";
};
export declare function wantsHtml(accept: string | undefined): boolean;
export declare function sanitizeRef(ref: unknown): string | null;
export declare function publicNumber(): string | null;
export declare function newVisitCode(): string;
export type EntryMode = "directo" | "menu";
export interface EntryRoutesOptions {
    /** Número configurado en el panel; si no hay o falla, se usa WA_PUBLIC_NUMBER. */
    resolveNumber?: () => Promise<string | null>;
    /** Registra la visita (código, origen y perfil elegido) sin datos personales; no bloquea la página. */
    onVisit?: (code: string, ref: string | null, profile: string | null) => Promise<void> | void;
    /** "menu" (por defecto) muestra las opciones de perfil; "directo" manda al chat en un salto. */
    entryMode?: () => Promise<EntryMode>;
}
export declare function isPreviewBot(userAgent: unknown): boolean;
export declare function entryRoutes(app: FastifyInstance, options?: EntryRoutesOptions): Promise<void>;
export default entryRoutes;
//# sourceMappingURL=index.d.ts.map