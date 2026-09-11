import type { Role } from "@prisma/client";
export interface JwtPayload {
    sub: string;
    role: Role;
    email?: string;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}
export interface ApiError {
    code: string;
    message: string;
    details?: unknown[];
}
//# sourceMappingURL=types.d.ts.map