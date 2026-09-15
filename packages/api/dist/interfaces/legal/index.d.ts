import type { FastifyInstance } from "fastify";
import { type LegalData, type LegalSection } from "../../application/legal/documents.js";
export interface LegalRoutesOptions {
    load?: () => Promise<LegalData>;
}
export declare function renderLegalPage(input: {
    title: string;
    sections: LegalSection[];
    complete: boolean;
    nonce: string;
}): string;
export declare function legalRoutes(app: FastifyInstance, options?: LegalRoutesOptions): Promise<void>;
export default legalRoutes;
//# sourceMappingURL=index.d.ts.map