export const AGENT_TOOLS = [
    {
        name: "register_vehicle",
        description: "Prepara una propuesta para registrar un vehículo. No lo guarda: el usuario debe revisar los datos y confirmar por el control de la aplicación. Nunca afirmes que ya está registrado.",
        parameters: {
            type: "object",
            properties: {
                brand: { type: "string", description: "Marca del vehículo" },
                model: { type: "string", description: "Modelo del vehículo" },
                year: { type: "number", description: "Año del vehículo" },
                mileage: { type: "number", description: "Kilometraje actual en km" },
                plate: { type: "string", description: "Placa del vehículo (opcional)" },
                vehicleClass: { type: "string", description: "Identificador de clase del catálogo de vehículos" },
                fuel: { type: "string", description: "Identificador de combustible del catálogo" },
                usageProfile: { type: "string", enum: ["urbano", "carretera", "severo"] },
            },
            required: ["brand", "model", "year", "mileage", "vehicleClass", "fuel", "usageProfile"],
        },
    },
    {
        name: "diagnose",
        description: "Realiza un diagnóstico basado en los síntomas reportados. Retorna posibles causas con probabilidades (no definitivas) y recomendaciones.",
        parameters: {
            type: "object",
            properties: {
                vehicleId: { type: "string", description: "ID del vehículo registrado" },
                symptoms: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de síntomas observados",
                },
            },
            required: ["symptoms"],
        },
    },
    {
        name: "get_maintenance_plan",
        description: "Consulta el plan del catálogo de mantenimiento para un vehículo registrado del usuario. No equivale a un manual específico del fabricante.",
        parameters: {
            type: "object",
            properties: {
                vehicleId: { type: "string", description: "ID del vehículo" },
                brand: { type: "string" },
                model: { type: "string" },
                year: { type: "number" },
                mileage: { type: "number" },
            },
            required: ["vehicleId"],
        },
    },
    {
        name: "get_alerts",
        description: "Obtiene las alertas preventivas activas para un vehículo.",
        parameters: {
            type: "object",
            properties: {
                vehicleId: { type: "string", description: "ID del vehículo" },
            },
            required: ["vehicleId"],
        },
    },
    {
        name: "search_shops",
        description: "Busca talleres certificados cercanos por ciudad o especialidad. Solo retorna talleres verificados de la base oficial.",
        parameters: {
            type: "object",
            properties: {
                city: { type: "string", description: "Ciudad de búsqueda" },
                specialty: { type: "string", description: "Especialidad requerida (frenos, motor, suspensión, etc.)" },
            },
            required: ["city"],
        },
    },
    {
        name: "book_appointment",
        description: "Agenda una cita con un taller certificado y genera un link de WhatsApp para contacto directo.",
        requiresConfirmation: true,
        parameters: {
            type: "object",
            properties: {
                vehicleId: { type: "string" },
                shopId: { type: "string", description: "ID del taller" },
                service: { type: "string", description: "Tipo de servicio requerido" },
                preferredDate: { type: "string", description: "Fecha preferida (YYYY-MM-DD)" },
                preferredTime: { type: "string", description: "Hora preferida (HH:MM)" },
            },
            required: ["shopId", "service"],
        },
    },
    {
        name: "quote_part",
        description: "Cotiza una repuesto específico para un vehículo.",
        parameters: {
            type: "object",
            properties: {
                partName: { type: "string", description: "Nombre o descripción del repuesto" },
                brand: { type: "string", description: "Marca del repuesto (opcional)" },
                vehicleId: { type: "string" },
                vehicleInfo: {
                    type: "object",
                    properties: {
                        brand: { type: "string" },
                        model: { type: "string" },
                        year: { type: "number" },
                    },
                },
            },
            required: ["partName"],
        },
    },
    {
        name: "search_parts",
        description: "Busca repuestos disponibles por nombre, categoría o compatibility con el vehículo.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Término de búsqueda" },
                vehicleId: { type: "string" },
                category: { type: "string", description: "Categoría (frenos, motor, suspensión, etc.)" },
            },
            required: ["query"],
        },
    },
];
//# sourceMappingURL=tools.js.map