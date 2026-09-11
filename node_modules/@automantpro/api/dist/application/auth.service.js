import { prisma } from "../infrastructure/prisma.js";
import { hashPassword, comparePassword } from "../infrastructure/password.js";
export async function register(input) {
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
        data: {
            email: input.email,
            phone: input.phone,
            passwordHash,
            role: input.role,
            name: input.name,
        },
        select: { id: true, email: true, phone: true, role: true, name: true },
    });
    return user;
}
export async function findByPhone(phone) {
    return prisma.user.findUnique({ where: { phone } });
}
export async function validateCredentials(input) {
    const user = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (!user || user.deletedAt)
        return null;
    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid)
        return null;
    return user;
}
export async function findUserById(id) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            name: true,
            locale: true,
            createdAt: true,
        },
    });
}
//# sourceMappingURL=auth.service.js.map