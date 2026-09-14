import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";
export declare function register(input: RegisterInput): Promise<{
    name: string;
    id: string;
    email: string | null;
    phone: string;
    role: import("@prisma/client").$Enums.Role;
}>;
export declare function findByPhone(phone: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    phone: string;
    passwordHash: string;
    role: import("@prisma/client").$Enums.Role;
    locale: string;
    city: string | null;
    consentAt: Date | null;
    consentVersion: string | null;
    source: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
} | null>;
export declare function validateCredentials(input: LoginInput): Promise<{
    name: string;
    id: string;
    email: string | null;
    phone: string;
    passwordHash: string;
    role: import("@prisma/client").$Enums.Role;
    locale: string;
    city: string | null;
    consentAt: Date | null;
    consentVersion: string | null;
    source: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
} | null>;
export declare function findUserById(id: string): Promise<{
    name: string;
    id: string;
    email: string | null;
    phone: string;
    role: import("@prisma/client").$Enums.Role;
    locale: string;
    createdAt: Date;
} | null>;
//# sourceMappingURL=auth.service.d.ts.map