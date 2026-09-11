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
    createdAt: Date;
    vehicleId: string;
    shopId: string;
    ownerId: string;
    scheduledAt: Date;
    status: import("@prisma/client").$Enums.AppointmentStatus;
    summary: string | null;
}) | null>;
export declare function update(appointmentId: string, userId: string, userRole: string, input: UpdateAppointmentInput): Promise<{
    id: string;
    createdAt: Date;
    vehicleId: string;
    shopId: string;
    ownerId: string;
    scheduledAt: Date;
    status: import("@prisma/client").$Enums.AppointmentStatus;
    summary: string | null;
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
        createdAt: Date;
        vehicleId: string;
        shopId: string;
        ownerId: string;
        scheduledAt: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        summary: string | null;
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
//# sourceMappingURL=appointment.service.d.ts.map