export interface ServiceItem {
    name: string;
    detail: string;
    durationMin: number | null;
    costRefUsd: number | null;
    costNote: string | null;
}
export interface ServicePage {
    slug: string;
    id: string;
    name: string;
    title: string;
    description: string;
    items: ServiceItem[];
    priceFrom: number | null;
    priceTo: number | null;
}
export interface CityPage {
    slug: string;
    name: string;
    province: string;
    zones: string[];
    title: string;
    description: string;
}
export declare function slugify(text: string): string;
export declare const SERVICE_PAGES: ServicePage[];
export declare const CITY_PAGES: CityPage[];
export declare const findService: (slug: string) => ServicePage | null;
export declare const findCity: (slug: string) => CityPage | null;
/** Preguntas frecuentes de una categoría, con los datos reales del catálogo. */
export declare function serviceFaq(page: ServicePage): Array<{
    q: string;
    a: string;
}>;
/** Preguntas frecuentes de una ciudad. */
export declare function cityFaq(city: CityPage): Array<{
    q: string;
    a: string;
}>;
//# sourceMappingURL=catalog.d.ts.map