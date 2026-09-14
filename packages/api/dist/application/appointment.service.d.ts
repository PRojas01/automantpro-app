import type { CreateAppointmentInput, UpdateAppointmentInput } from "../schemas/appointment.schema.js";
export declare function create(ownerId: string, input: CreateAppointmentInput): Promise<({
    vehicle: {
        model: string;
        id: string;
        make: string;
    };
    shop: {
        name: string;
        id: string;
    };
} & {
    id: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    vehicleId: string;
    shopId: string;
    ownerId: string;
    scheduledAt: Date;
    status: import("@prisma/client").$Enums.AppointmentStatus;
    summary: string | null;
    services: import("@prisma/client/runtime/library").JsonValue | null;
    cancelReason: string | null;
}) | null>;
export declare function update(appointmentId: string, userId: string, userRole: string, input: UpdateAppointmentInput): Promise<{
    id: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    vehicleId: string;
    shopId: string;
    ownerId: string;
    scheduledAt: Date;
    status: import("@prisma/client").$Enums.AppointmentStatus;
    summary: string | null;
    services: import("@prisma/client/runtime/library").JsonValue | null;
    cancelReason: string | null;
} | null>;
export declare function list(userId: string, userRole: string, filters: {
    status?: string;
    page: number;
    limit: number;
}): Promise<{
    data: ({
        vehicle: {
            model: string;
            id: string;
            make: string;
        };
        shop: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date | null;
        vehicleId: string;
        shopId: string;
        ownerId: string;
        scheduledAt: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        summary: string | null;
        services: import("@prisma/client/runtime/library").JsonValue | null;
        cancelReason: string | null;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
//# sourceMappingURL=appointment.service.d.ts.map