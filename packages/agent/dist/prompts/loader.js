import { NEUTRAL_FALLBACK_PROMPT } from "../llm-gateway/ports.js";
export function loadSystemPrompt() {
    return NEUTRAL_FALLBACK_PROMPT;
}
export function loadTrainingExamples() {
    return [];
}
export function loadEvalExamples() {
    return [];
}
export function buildInitialGreeting() {
    return "¡Bienvenido! Recibe asesoría técnica automotriz confiable para tu vehículo: Registra tu auto y realizaremos un diagnóstico rápido, priorizando la reducción de fallas costosas mediante verificaciones y mantenimiento preventivo, y te generaremos un plan personalizado de mantenimiento junto con la conexión directa a talleres certificados en tu zona. Todo en pocos pasos sencillos. ¿Listo para empezar?";
}
//# sourceMappingURL=loader.js.map