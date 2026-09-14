const FALLBACK_TEXTS = {
    quota: "Tu cuota de asistencia inteligente está agotada. Puedes continuar con las opciones guiadas del menú o contactar a un asesor escribiendo 'humano'.",
    budget: "El asistente inteligente no está disponible en este momento por límite diario de uso. Puedes continuar con las opciones guiadas del menú o escribir 'humano'.",
    validation: "No pude interpretar tu solicitud con la asistencia inteligente en este momento. Por favor inténtalo de nuevo o escribe 'humano' para hablar con un asesor.",
    circuit_open: "El servicio de asistencia inteligente está temporalmente fuera de línea. Inténtalo en unos minutos o escribe 'humano'.",
};
const FALLBACK_DEFAULT = "No pude procesar tu solicitud en este momento. Puedes continuar con las opciones guiadas del menú o escribir 'humano'.";
export function buildFallbackResponse(reason) {
    return reason ? FALLBACK_TEXTS[reason] ?? FALLBACK_DEFAULT : FALLBACK_DEFAULT;
}
//# sourceMappingURL=fallback.js.map