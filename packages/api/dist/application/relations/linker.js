export function createRelationLinker(store) {
    const quiet = async (work, fallback) => {
        try {
            return await work();
        }
        catch {
            return fallback;
        }
    };
    return {
        fromAppointment: (input) => quiet(() => store.ensureForOrigin({
            kind: "dueno_taller",
            originType: "appointment",
            originId: input.appointmentId,
            subject: input.subject,
            parties: [
                { userId: input.ownerId, role: "dueno" },
                { userId: input.shopUserId, role: "taller" },
            ],
            createdBy: input.createdBy,
        }), null),
        fromWorkOrder: (input) => quiet(() => store.ensureForOrigin({
            kind: "dueno_taller",
            originType: "workorder",
            originId: input.workOrderId,
            subject: input.subject,
            parties: [
                { userId: input.ownerId, role: "dueno" },
                { userId: input.shopUserId, role: "taller" },
            ],
            createdBy: input.createdBy,
        }), null),
        fromQuoteRequest: async (input) => {
            const kind = input.requesterRole === "taller" ? "taller_almacen" : "dueno_almacen";
            const role = input.requesterRole === "taller" ? "taller" : "dueno";
            const ids = [];
            for (const storeUserId of input.storeUserIds) {
                // Un vínculo por almacén invitado: cada conversación es independiente.
                const id = await quiet(() => store.ensureForOrigin({
                    kind,
                    originType: "quote",
                    originId: `${input.requestId}:${storeUserId}`,
                    subject: input.subject,
                    parties: [
                        { userId: input.requesterId, role },
                        { userId: storeUserId, role: "almacen" },
                    ],
                    createdBy: input.createdBy,
                }), null);
                if (id)
                    ids.push(id);
            }
            return ids;
        },
    };
}
//# sourceMappingURL=linker.js.map