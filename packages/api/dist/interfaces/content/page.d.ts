import type { CityPage, ServicePage } from "../../application/content/catalog.js";
export interface ContentPageInput {
    number: string | null;
    code: string;
    nonce: string;
    path: string;
    title: string;
    description: string;
    h1: string;
    intro: string;
    /** Bloques de contenido: título y cuerpo ya en HTML seguro. */
    blocks: Array<{
        title: string;
        html: string;
    }>;
    faq: Array<{
        q: string;
        a: string;
    }>;
    related: Array<{
        href: string;
        label: string;
    }>;
    breadcrumb: Array<{
        href: string;
        label: string;
    }>;
    /** Texto con el que se abre el chat desde esta página. */
    chatText: string;
}
export declare function renderContentPage(input: ContentPageInput): string;
export declare function serviceBlocks(page: ServicePage): Array<{
    title: string;
    html: string;
}>;
export declare function cityBlocks(city: CityPage): Array<{
    title: string;
    html: string;
}>;
//# sourceMappingURL=page.d.ts.map