export declare function listPendingVerification(page: number, limit: number): Promise<{
    data: {
        name: string;
        user: {
            name: string;
            id: string;
            phone: string;
        };
        id: string;
        address: string;
        city: string;
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
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    address: string;
    city: string;
    lat: number | null;
    lng: number | null;
    specialties: import("@prisma/client/runtime/library").JsonValue | null;
    verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
    ratingAvg: number;
} | null>;
//# sourceMappingURL=admin.service.d.ts.map