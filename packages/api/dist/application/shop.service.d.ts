interface ShopFilters {
    city?: string;
    specialty?: string;
    verified?: boolean;
    page: number;
    limit: number;
}
export declare function list(filters: ShopFilters): Promise<{
    data: {
        name: string;
        id: string;
        city: string;
        address: string;
        specialties: import("@prisma/client/runtime/library").JsonValue;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
        ratingAvg: number;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
export declare function findById(id: string): Promise<{
    name: string;
    id: string;
    city: string;
    address: string;
    lat: number | null;
    lng: number | null;
    specialties: import("@prisma/client/runtime/library").JsonValue;
    verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
    ratingAvg: number;
} | null>;
export declare function getAvailability(shopId: string, date?: string): Promise<{
    scheduledAt: Date;
    status: import("@prisma/client").$Enums.AppointmentStatus;
}[]>;
export declare function findByUserId(userId: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    city: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    address: string;
    lat: number | null;
    lng: number | null;
    specialties: import("@prisma/client/runtime/library").JsonValue | null;
    verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
    ratingAvg: number;
    ruc: string | null;
    zone: string | null;
    hours: string | null;
    contactName: string | null;
} | null>;
export {};
//# sourceMappingURL=shop.service.d.ts.map