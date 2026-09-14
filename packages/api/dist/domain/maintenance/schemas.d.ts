import { z } from "zod";
export declare const vehicleClassSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    subtypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    subtypes: string[];
}, {
    name: string;
    id: string;
    subtypes?: string[] | undefined;
}>;
export declare const fuelSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
}, {
    name: string;
    id: string;
}>;
export declare const vehicleClassesSchema: z.ZodObject<{
    version: z.ZodString;
    source: z.ZodString;
    generatedAt: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    classes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        subtypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        subtypes: string[];
    }, {
        name: string;
        id: string;
        subtypes?: string[] | undefined;
    }>, "many">;
    fuels: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
    }, {
        name: string;
        id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: string;
    source: string;
    classes: {
        name: string;
        id: string;
        subtypes: string[];
    }[];
    fuels: {
        name: string;
        id: string;
    }[];
    generatedAt?: string | undefined;
    note?: string | undefined;
}, {
    version: string;
    source: string;
    classes: {
        name: string;
        id: string;
        subtypes?: string[] | undefined;
    }[];
    fuels: {
        name: string;
        id: string;
    }[];
    generatedAt?: string | undefined;
    note?: string | undefined;
}>;
export declare const appliesToSchema: z.ZodObject<{
    classes: z.ZodArray<z.ZodString, "many">;
    fuels: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    classes: string[];
    fuels: string[];
}, {
    classes: string[];
    fuels: string[];
}>;
export declare const subserviceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    detail: z.ZodOptional<z.ZodString>;
    periodic: z.ZodDefault<z.ZodBoolean>;
    appliesTo: z.ZodObject<{
        classes: z.ZodArray<z.ZodString, "many">;
        fuels: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        classes: string[];
        fuels: string[];
    }, {
        classes: string[];
        fuels: string[];
    }>;
    durationMin: z.ZodNumber;
    costRefUsd: z.ZodNumber;
    costNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    periodic: boolean;
    appliesTo: {
        classes: string[];
        fuels: string[];
    };
    durationMin: number;
    costRefUsd: number;
    detail?: string | undefined;
    costNote?: string | undefined;
}, {
    name: string;
    id: string;
    appliesTo: {
        classes: string[];
        fuels: string[];
    };
    durationMin: number;
    costRefUsd: number;
    detail?: string | undefined;
    periodic?: boolean | undefined;
    costNote?: string | undefined;
}>;
export declare const categorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    order: z.ZodNumber;
    subservices: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
        periodic: z.ZodDefault<z.ZodBoolean>;
        appliesTo: z.ZodObject<{
            classes: z.ZodArray<z.ZodString, "many">;
            fuels: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            classes: string[];
            fuels: string[];
        }, {
            classes: string[];
            fuels: string[];
        }>;
        durationMin: z.ZodNumber;
        costRefUsd: z.ZodNumber;
        costNote: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        periodic: boolean;
        appliesTo: {
            classes: string[];
            fuels: string[];
        };
        durationMin: number;
        costRefUsd: number;
        detail?: string | undefined;
        costNote?: string | undefined;
    }, {
        name: string;
        id: string;
        appliesTo: {
            classes: string[];
            fuels: string[];
        };
        durationMin: number;
        costRefUsd: number;
        detail?: string | undefined;
        periodic?: boolean | undefined;
        costNote?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    order: number;
    subservices: {
        name: string;
        id: string;
        periodic: boolean;
        appliesTo: {
            classes: string[];
            fuels: string[];
        };
        durationMin: number;
        costRefUsd: number;
        detail?: string | undefined;
        costNote?: string | undefined;
    }[];
}, {
    name: string;
    id: string;
    order: number;
    subservices: {
        name: string;
        id: string;
        appliesTo: {
            classes: string[];
            fuels: string[];
        };
        durationMin: number;
        costRefUsd: number;
        detail?: string | undefined;
        periodic?: boolean | undefined;
        costNote?: string | undefined;
    }[];
}>;
export declare const serviceTaxonomySchema: z.ZodObject<{
    version: z.ZodString;
    source: z.ZodString;
    generatedAt: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    categories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        order: z.ZodNumber;
        subservices: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            detail: z.ZodOptional<z.ZodString>;
            periodic: z.ZodDefault<z.ZodBoolean>;
            appliesTo: z.ZodObject<{
                classes: z.ZodArray<z.ZodString, "many">;
                fuels: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                classes: string[];
                fuels: string[];
            }, {
                classes: string[];
                fuels: string[];
            }>;
            durationMin: z.ZodNumber;
            costRefUsd: z.ZodNumber;
            costNote: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            periodic: boolean;
            appliesTo: {
                classes: string[];
                fuels: string[];
            };
            durationMin: number;
            costRefUsd: number;
            detail?: string | undefined;
            costNote?: string | undefined;
        }, {
            name: string;
            id: string;
            appliesTo: {
                classes: string[];
                fuels: string[];
            };
            durationMin: number;
            costRefUsd: number;
            detail?: string | undefined;
            periodic?: boolean | undefined;
            costNote?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        order: number;
        subservices: {
            name: string;
            id: string;
            periodic: boolean;
            appliesTo: {
                classes: string[];
                fuels: string[];
            };
            durationMin: number;
            costRefUsd: number;
            detail?: string | undefined;
            costNote?: string | undefined;
        }[];
    }, {
        name: string;
        id: string;
        order: number;
        subservices: {
            name: string;
            id: string;
            appliesTo: {
                classes: string[];
                fuels: string[];
            };
            durationMin: number;
            costRefUsd: number;
            detail?: string | undefined;
            periodic?: boolean | undefined;
            costNote?: string | undefined;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: string;
    source: string;
    categories: {
        name: string;
        id: string;
        order: number;
        subservices: {
            name: string;
            id: string;
            periodic: boolean;
            appliesTo: {
                classes: string[];
                fuels: string[];
            };
            durationMin: number;
            costRefUsd: number;
            detail?: string | undefined;
            costNote?: string | undefined;
        }[];
    }[];
    generatedAt?: string | undefined;
    note?: string | undefined;
}, {
    version: string;
    source: string;
    categories: {
        name: string;
        id: string;
        order: number;
        subservices: {
            name: string;
            id: string;
            appliesTo: {
                classes: string[];
                fuels: string[];
            };
            durationMin: number;
            costRefUsd: number;
            detail?: string | undefined;
            periodic?: boolean | undefined;
            costNote?: string | undefined;
        }[];
    }[];
    generatedAt?: string | undefined;
    note?: string | undefined;
}>;
export declare const maintenanceRuleSchema: z.ZodObject<{
    serviceId: z.ZodString;
    classId: z.ZodArray<z.ZodString, "many">;
    fuelId: z.ZodArray<z.ZodString, "many">;
    intervalKm: z.ZodNullable<z.ZodNumber>;
    intervalMonths: z.ZodNullable<z.ZodNumber>;
    severeFactor: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    intervalKm: number | null;
    serviceId: string;
    classId: string[];
    fuelId: string[];
    intervalMonths: number | null;
    severeFactor: number;
    note?: string | undefined;
}, {
    intervalKm: number | null;
    serviceId: string;
    classId: string[];
    fuelId: string[];
    intervalMonths: number | null;
    severeFactor: number;
    note?: string | undefined;
}>;
export declare const maintenanceRulesSchema: z.ZodObject<{
    version: z.ZodString;
    source: z.ZodString;
    generatedAt: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
    rules: z.ZodArray<z.ZodObject<{
        serviceId: z.ZodString;
        classId: z.ZodArray<z.ZodString, "many">;
        fuelId: z.ZodArray<z.ZodString, "many">;
        intervalKm: z.ZodNullable<z.ZodNumber>;
        intervalMonths: z.ZodNullable<z.ZodNumber>;
        severeFactor: z.ZodNumber;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        intervalKm: number | null;
        serviceId: string;
        classId: string[];
        fuelId: string[];
        intervalMonths: number | null;
        severeFactor: number;
        note?: string | undefined;
    }, {
        intervalKm: number | null;
        serviceId: string;
        classId: string[];
        fuelId: string[];
        intervalMonths: number | null;
        severeFactor: number;
        note?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: string;
    source: string;
    rules: {
        intervalKm: number | null;
        serviceId: string;
        classId: string[];
        fuelId: string[];
        intervalMonths: number | null;
        severeFactor: number;
        note?: string | undefined;
    }[];
    generatedAt?: string | undefined;
    note?: string | undefined;
}, {
    version: string;
    source: string;
    rules: {
        intervalKm: number | null;
        serviceId: string;
        classId: string[];
        fuelId: string[];
        intervalMonths: number | null;
        severeFactor: number;
        note?: string | undefined;
    }[];
    generatedAt?: string | undefined;
    note?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map