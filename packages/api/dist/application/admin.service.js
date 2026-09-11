import { prisma } from "../infrastructure/prisma.js";
export async function listPendingVerification(page, limit) {
    const where = { verificationStatus: "pending" };
    const [total, shops] = await Promise.all([
        prisma.shop.count({ where }),
        prisma.shop.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                verificationStatus: true,
                user: { select: { id: true, name: true, phone: true } },
            },
        }),
    ]);
    return { data: shops, meta: { page, limit, total } };
}
export async function verifyShop(shopId, status) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop)
        return null;
    return prisma.shop.update({
        where: { id: shopId },
        data: { verificationStatus: status },
    });
}
//# sourceMappingURL=admin.service.js.map