import type { FastifyInstance } from "fastify";
export interface SeoRoutesOptions {
    /** Dominio público del sitio, sin barra final. */
    site?: string;
}
export declare function robotsTxt(site: string): string;
export declare function sitemapXml(site: string, now?: Date): string;
/**
 * Resumen para asistentes de IA (convención llms.txt): qué es, a quién sirve y cómo se usa,
 * en texto plano y corto, que es lo que estos sistemas citan mejor.
 */
export declare function llmsTxt(site: string, phone: string | null): string;
export declare function seoRoutes(app: FastifyInstance, options?: SeoRoutesOptions & {
    resolveNumber?: () => Promise<string | null>;
}): Promise<void>;
export default seoRoutes;
//# sourceMappingURL=index.d.ts.map