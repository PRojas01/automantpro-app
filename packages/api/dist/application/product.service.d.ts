import type { CreateProductInput, UpdateProductInput, productFilterSchema } from "../schemas/product.schema.js";
import type { z } from "zod";
export declare function list(filters: z.infer<typeof productFilterSchema>): Promise<{
    data: ({
        compat: {
            vehicleId: string;
        }[];
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
export declare function findById(id: string): Promise<({
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
}) | null>;
export declare function create(userId: string, input: CreateProductInput): Promise<({
    compat: {
        vehicleId: string;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    price: import("@prisma/client/runtime/library").Decimal;
    stock: number | null;
    image: string | null;
    storeId: string;
}) | null>;
export declare function update(userId: string, productId: string, input: UpdateProductInput): Promise<({
    compat: {
        vehicleId: string;
    }[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    price: import("@prisma/client/runtime/library").Decimal;
    stock: number | null;
    image: string | null;
    storeId: string;
}) | null>;
//# sourceMappingURL=product.service.d.ts.map