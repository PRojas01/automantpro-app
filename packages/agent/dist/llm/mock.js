export class MockLLMProvider {
    greeting = false;
    async chat(messages, _tools) {
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const userText = lastUser?.content?.toLowerCase() ?? "";
        if (!this.greeting) {
            this.greeting = true;
            return {
                content: "¡Bienvenido! Recibe asesoría técnica automotriz confiable para tu vehículo: " +
                    "Registra tu auto y realizaremos un diagnóstico rápido, priorizando la reducción de fallas costosas " +
                    "mediante verificaciones y mantenimiento preventivo, y te generaremos un plan personalizado de mantenimiento " +
                    "junto con la conexión directa a talleres certificados en tu zona. Todo en pocos pasos sencillos. ¿Listo para empezar?",
            };
        }
        const hasSymptom = userText.includes("ruido") ||
            userText.includes("vibra") ||
            userText.includes("freno") ||
            userText.includes("motor") ||
            userText.includes("fuga") ||
            userText.includes("batería") ||
            userText.includes("check engine") ||
            userText.includes("testigo");
        if (hasSymptom) {
            return {
                content: "Para ayudarte mejor, necesito registrar tu vehículo. ¿Cuál es la marca, modelo, año y kilometraje actual?",
                tool_calls: [
                    {
                        id: "call_diag_001",
                        type: "function",
                        function: {
                            name: "diagnose",
                            arguments: JSON.stringify({
                                symptoms: [lastUser?.content ?? "síntoma reportado"],
                            }),
                        },
                    },
                ],
            };
        }
        if (userText.includes("taller") || userText.includes("agendar") || userText.includes("cita")) {
            return {
                content: "Puedo conectarte con talleres certificados en tu zona. ¿En qué ciudad te encuentras y qué servicio necesitas?",
            };
        }
        if (userText.includes("plan") || userText.includes("mantenimiento")) {
            return {
                content: "Generaré un plan personalizado de mantenimiento. ¿Cuál es la marca, modelo, año y kilometraje de tu vehículo?",
                tool_calls: [
                    {
                        id: "call_plan_001",
                        type: "function",
                        function: {
                            name: "get_maintenance_plan",
                            arguments: JSON.stringify({
                                brand: "N/A",
                                model: "N/A",
                                year: 2020,
                                mileage: 50000,
                            }),
                        },
                    },
                ],
            };
        }
        return {
            content: "Entiendo. ¿Podrías contarme más sobre tu vehículo y los síntomas que estás experimentando? Así puedo ayudarte mejor.",
        };
    }
    reset() {
        this.greeting = false;
    }
}
//# sourceMappingURL=mock.js.map