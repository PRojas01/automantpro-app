import type { CreateVehicleInput, UpdateVehicleInput } from "../schemas/vehicle.schema.js";
export declare function listByUser(userId: string): Promise<{
    model: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    make: string;
    year: number;
    currentKm: number;
    plan: import("@prisma/client/runtime/library").JsonValue | null;
    vehicleClass: string | null;
    fuel: string | null;
    plate: string | null;
    usageProfile: string | null;
    remindersOptIn: boolean;
}[]>;
export declare function create(userId: string, input: CreateVehicleInput): Promise<{
    model: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    make: string;
    year: number;
    currentKm: number;
    plan: import("@prisma/client/runtime/library").JsonValue | null;
    vehicleClass: string | null;
    fuel: string | null;
    plate: string | null;
    usageProfile: string | null;
    remindersOptIn: boolean;
}>;
export declare function update(userId: string, vehicleId: string, input: UpdateVehicleInput): Promise<{
    model: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    make: string;
    year: number;
    currentKm: number;
    plan: import("@prisma/client/runtime/library").JsonValue | null;
    vehicleClass: string | null;
    fuel: string | null;
    plate: string | null;
    usageProfile: string | null;
    remindersOptIn: boolean;
} | null>;
export declare function findByIdAndUser(vehicleId: string, userId: string): Promise<{
    model: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    userId: string;
    make: string;
    year: number;
    currentKm: number;
    plan: import("@prisma/client/runtime/library").JsonValue | null;
    vehicleClass: string | null;
    fuel: string | null;
    plate: string | null;
    usageProfile: string | null;
    remindersOptIn: boolean;
} | null>;
export declare function getMaintenancePlan(vehicleId: string): Promise<{
    id: string;
    createdAt: Date;
    vehicleId: string;
    task: string;
    intervalKm: number | null;
    dueDate: Date | null;
    lastDoneAt: Date | null;
}[]>;
export declare function getHistory(vehicleId: string): Promise<({
    shop: {
        name: string;
        id: string;
    };
} & {
    id: string;
    createdAt: Date;
    vehicleId: string;
    shopId: string;
    status: string;
    appointmentId: string | null;
    description: string;
    cost: import("@prisma/client/runtime/library").Decimal | null;
    photos: import("@prisma/client/runtime/library").JsonValue | null;
})[]>;
//# sourceMappingURL=vehicle.service.d.ts.map