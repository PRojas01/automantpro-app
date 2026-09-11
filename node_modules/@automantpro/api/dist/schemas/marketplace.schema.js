import { z } from "zod";
export const marketplaceFilterSchema = z.object({
    q: z.string().optional(),
    vehicleMake: z.string().optional(),
    vehicleModel: z.string().optional(),
    year: z.coerce.number().int().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=marketplace.schema.js.map