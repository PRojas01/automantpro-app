export declare function listPendingVerification(page: number, limit: number): Promise<{
    data: {
        name: string;
        user: {
            name: string;
            id: string;
            phone: string;
        };
        id: string;
        city: string;
        address: string;
        verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}>;
export declare function verifyShop(shopId: string, status: "verified" | "rejected"): Promise<{
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
//# sourceMappingURL=admin.service.d.ts.map