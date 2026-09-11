import { z } from "zod";
export const shopFilterSchema = z.object({
    city: z.string().optional(),
    specialty: z.string().optional(),
    verified: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=shop.schema.js.map