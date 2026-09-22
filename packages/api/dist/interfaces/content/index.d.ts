import type { FastifyInstance } from "fastify";
export interface ContentRoutesOptions {
    resolveNumber?: () => Promise<string | null>;
    /** Registra la visita con su origen, igual que la portada. */
    onVisit?: (code: string, ref: string | null, profile: string | null) => Promise<void> | void;
    codeTaken?: (code: string) => Promise<boolean>;
}
export declare function contentRoutes(app: FastifyInstance, options?: ContentRoutesOptions): Promise<void>;
export default contentRoutes;
//# sourceMappingURL=index.d.ts.map