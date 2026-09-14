import { CallCycle } from "../llm-gateway/call-cycle.js";
import { fromLegacyProvider, MockLLMAdapter } from "../llm-gateway/adapters/mock.js";
import { OpenAIAdapter } from "../llm-gateway/adapters/openai.js";
import { buildConfig, loadGatewayConfig } from "../llm-gateway/config.js";
import { InMemoryPromptStore, InMemoryQuotaStore, InMemoryToolCallStore, InMemoryToolExecutor, InMemoryUsageStore, } from "../llm-gateway/ports.js";
import { AGENT_TOOLS } from "./tools.js";
import { buildInitialGreeting } from "../prompts/loader.js";
export class AgentOrchestrator {
    providerKind;
    toolHandlers = new Map();
    sessions = new Map();
    promptStore = new InMemoryPromptStore();
    usageStore = new InMemoryUsageStore();
    toolCallStore = new InMemoryToolCallStore();
    quota = new InMemoryQuotaStore();
    cycle = null;
    adapterOverride = null;
    configOverride = null;
    constructor(provider = "mock") {
        this.providerKind = provider;
        this.registerDefaultTools();
    }
    setConfig(config) {
        this.configOverride = config;
        this.cycle = null;
    }
    setLLMProvider(provider) {
        this.adapterOverride = fromLegacyProvider(provider);
        this.cycle = null;
    }
    registerTool(name, handler) {
        this.toolHandlers.set(name, handler);
    }
    getRegisteredTools() {
        return [...this.toolHandlers.keys()];
    }
    async handleIncoming(sessionId, userMessage) {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = { messages: [], firstMessage: true };
            this.sessions.set(sessionId, session);
        }
        const priorTurns = [...session.messages];
        if (session.firstMessage) {
            session.firstMessage = false;
            session.messages.push({ role: "user", content: userMessage });
            const greeting = buildInitialGreeting();
            session.messages.push({ role: "assistant", content: greeting });
            const result = await this.runCycle(priorTurns, userMessage);
            const reply = result.outcome === "ok" && result.content ? result.content : greeting;
            if (reply !== greeting)
                session.messages[session.messages.length - 1].content = reply;
            return reply;
        }
        session.messages.push({ role: "user", content: userMessage });
        const result = await this.runCycle(priorTurns, userMessage);
        const reply = result.content ?? "¿En qué puedo ayudarte?";
        session.messages.push({ role: "assistant", content: reply });
        return reply;
    }
    getSessionMessages(sessionId) {
        return this.sessions.get(sessionId)?.messages ?? [];
    }
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    getUsage() {
        return this.usageStore.list();
    }
    getToolCalls() {
        return this.toolCallStore.list();
    }
    ensureCycle() {
        if (this.cycle)
            return this.cycle;
        const config = this.configOverride ??
            (this.providerKind === "openai" ? loadGatewayConfig() : buildConfig({ provider: "mock" }));
        const adapter = this.adapterOverride ??
            (this.providerKind === "openai" ? new OpenAIAdapter(config) : new MockLLMAdapter());
        const executor = new InMemoryToolExecutor(this.toolHandlers);
        this.cycle = new CallCycle({
            adapter,
            promptStore: this.promptStore,
            executor,
            quota: this.quota,
            usageStore: this.usageStore,
            toolCallStore: this.toolCallStore,
            config,
        });
        return this.cycle;
    }
    async runCycle(priorTurns, userMessage) {
        const cycle = this.ensureCycle();
        const params = {
            agent: "owner",
            tier: "fast",
            turns: priorTurns,
            userMessage,
            tools: AGENT_TOOLS,
        };
        return cycle.run(params);
    }
    registerDefaultTools() {
        this.toolHandlers.set("register_vehicle", async (args) => ({
            toolName: "register_vehicle",
            success: true,
            data: {
                vehicleId: `veh_${Date.now()}`,
                brand: args.brand,
                model: args.model,
                year: args.year,
                mileage: args.mileage,
                plate: args.plate ?? null,
                message: "Vehículo registrado exitosamente.",
            },
        }));
        this.toolHandlers.set("diagnose", async (args) => {
            const symptoms = args.symptoms ?? [];
            return {
                toolName: "diagnose",
                success: true,
                data: {
                    vehicleId: args.vehicleId ?? null,
                    symptoms,
                    possibleCauses: [
                        {
                            component: "Sistema de frenos",
                            probability: 0.75,
                            description: "Desgaste de pastillas o discos puede causar vibraciones al frenar.",
                        },
                        {
                            component: "Suspensión",
                            probability: 0.45,
                            description: "Amortiguadores o bujes desgastados generan ruidos e inestabilidad.",
                        },
                        {
                            component: "Sistema de encendido",
                            probability: 0.3,
                            description: "Bujías o bobinas defectuosas pueden causar fallas y vibraciones.",
                        },
                    ],
                    recommendations: [
                        "Revisar pastillas y discos de freno (verificar espesor mínimo).",
                        "Inspeccionar amortiguadores y bujes de suspensión.",
                        "Realizar escaneo OBDII para detectar códigos de falla.",
                        "Esto es una orientación: acude a un taller certificado para verificación.",
                    ],
                    urgency: "medium",
                    disclaimer: "Este diagnóstico es orientativo y no sustituye una revisión presencial en taller certificado.",
                },
            };
        });
        this.toolHandlers.set("get_maintenance_plan", async (args) => ({
            toolName: "get_maintenance_plan",
            success: true,
            data: {
                vehicle: {
                    brand: args.brand,
                    model: args.model,
                    year: args.year,
                    mileage: args.mileage,
                },
                plan: [
                    { service: "Cambio de aceite y filtro", intervalKm: 5000, intervalMonths: 6, priority: "high" },
                    { service: "Revisión de frenos", intervalKm: 10000, intervalMonths: 12, priority: "high" },
                    { service: "Rotación de neumáticos", intervalKm: 8000, intervalMonths: 6, priority: "medium" },
                    { service: "Cambio de filtro de aire", intervalKm: 15000, intervalMonths: 12, priority: "medium" },
                    { service: "Revisión de correa de distribución", intervalKm: 60000, intervalMonths: 48, priority: "high" },
                    { service: "Cambio de líquido de frenos", intervalKm: 20000, intervalMonths: 24, priority: "medium" },
                ],
            },
        }));
        this.toolHandlers.set("get_alerts", async (args) => ({
            toolName: "get_alerts",
            success: true,
            data: {
                vehicleId: args.vehicleId,
                alerts: [
                    {
                        id: `alert_${Date.now()}`,
                        type: "maintenance",
                        message: "Cambio de aceite pendiente según kilometraje.",
                        urgency: "high",
                    },
                    {
                        id: `alert_${Date.now() + 1}`,
                        type: "inspection",
                        message: "Revisión de frenos recomendada por desgaste estimado.",
                        urgency: "medium",
                    },
                ],
            },
        }));
        this.toolHandlers.set("search_shops", async (args) => ({
            toolName: "search_shops",
            success: true,
            data: {
                city: args.city,
                specialty: args.specialty ?? null,
                shops: [
                    {
                        id: "shop_001",
                        name: "Taller Mecánico El Motor",
                        address: "Av. Principal 123",
                        specialty: "Motor y transmisión",
                        phone: "+593999999999",
                        city: args.city,
                    },
                    {
                        id: "shop_002",
                        name: "Frenos y Suspensión Pro",
                        address: "Calle Secundaria 456",
                        specialty: "Frenos y suspensión",
                        phone: "+593999999999",
                        city: args.city,
                    },
                ],
            },
        }));
        this.toolHandlers.set("book_appointment", async (args) => ({
            toolName: "book_appointment",
            success: true,
            data: {
                appointmentId: `apt_${Date.now()}`,
                shopId: args.shopId,
                service: args.service,
                preferredDate: args.preferredDate ?? null,
                preferredTime: args.preferredTime ?? null,
                status: "pending",
                whatsappLink: null,
                message: "Cita solicitada. El taller confirmará por WhatsApp.",
            },
        }));
        this.toolHandlers.set("quote_part", async (args) => ({
            toolName: "quote_part",
            success: true,
            data: {
                partName: args.partName,
                brand: args.brand ?? "Genérico",
                price: 45.99,
                currency: "USD",
                availability: "in_stock",
                message: "Cotización referencial. Precio puede variar según proveedor.",
            },
        }));
        this.toolHandlers.set("search_parts", async (args) => ({
            toolName: "search_parts",
            success: true,
            data: {
                query: args.query,
                category: args.category ?? null,
                parts: [
                    { name: "Pastillas de freno delanteras", brand: "Brembo", price: 35.0, currency: "USD", availability: "in_stock" },
                    { name: "Disco de freno", brand: "Bosch", price: 55.0, currency: "USD", availability: "order" },
                ],
            },
        }));
    }
}
//# sourceMappingURL=orchestrator.js.map