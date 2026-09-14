import type { FastifyInstance } from "fastify";
export declare const API_STATUS: {
    readonly status: "ok";
    readonly service: "AutoMantPro API";
};
export declare function wantsHtml(accept: string | undefined): boolean;
export declare function sanitizeRef(ref: unknown): string | null;
export declare function publicNumber(): string | null;
export declare function newVisitCode(): string;
export declare function entryRoutes(app: FastifyInstance): Promise<void>;
export default entryRoutes;
//# sourceMappingURL=index.d.ts.map