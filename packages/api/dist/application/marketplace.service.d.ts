import type { marketplaceFilterSchema } from "../schemas/marketplace.schema.js";
import type { z } from "zod";
export declare function search(filters: z.infer<typeof marketplaceFilterSchema>): Promise<{
    data: ({
        compat: ({
            vehicle: {
                model: string;
                id: string;
                make: string;
                year: number;
            };
        } & {
            id: string;
            vehicleId: string;
            productId: string;
        })[];
        store: {
            name: string;
            id: string;
            city: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number | null;
        image: string | null;
        storeId: string;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
//# sourceMappingURL=marketplace.service.d.ts.map