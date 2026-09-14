export interface ShopCandidate {
    id: string;
    name: string;
    address: string;
    city: string;
    zone: string | null;
    hours: string | null;
    ratingAvg: number;
    /** Categorías del catálogo que ofrece el taller. */
    services: string[];
}
export interface RankedShop extends ShopCandidate {
    covered: number;
    needed: number;
}
export declare function rankShops(shops: ShopCandidate[], neededCategories: string[]): RankedShop[];
//# sourceMappingURL=matching.d.ts.map