import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const DEFAULT_CORPUS_DIR = "C:/Users/Estudio/Documents/PROYECTOS_PROGRAMACION/AutoMantPro/APP";
function getCorpusDir() {
    return process.env.AGENT_CORPUS_DIR || DEFAULT_CORPUS_DIR;
}
export function loadSystemPrompt() {
    const dir = getCorpusDir();
    const promptPath = join(dir, "Actúa como un asesor y asistente té.txt");
    if (!existsSync(promptPath)) {
        return buildFallbackPrompt();
    }
    const raw = readFileSync(promptPath, "utf-8");
    return raw.trim();
}
export function loadTrainingExamples() {
    const dir = getCorpusDir();
    const trainPath = join(dir, "automantpro_train.jsonl");
    if (!existsSync(trainPath)) {
        return [];
    }
    const raw = readFileSync(trainPath, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim());
    return lines.map((line) => {
        const parsed = JSON.parse(line);
        return parsed.messages;
    });
}
export function loadEvalExamples() {
    const dir = getCorpusDir();
    const evalPath = join(dir, "automantpro_eval.jsonl");
    if (!existsSync(evalPath)) {
        return [];
    }
    const raw = readFileSync(evalPath, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim());
    return lines.map((line) => {
        const parsed = JSON.parse(line);
        return parsed.messages;
    });
}
function buildFallbackPrompt() {
    return `Actúa como un asesor y asistente técnico automotriz especializado, enfocado en ayudar al usuario a reducir al máximo el riesgo de fallas costosas en su vehículo.
Tu objetivo central es responder al usuario sus necesidades de forma directa y sencilla, identificar intereses, necesidades y preocupaciones de los dueños de automóviles.
Reglas: máximo 2-3 frases por intervención, español por defecto, nunca pedir imágenes/audio/video, nunca prometer funciones inexistentes, dar probabilidades no diagnósticos definitivos.`;
}
export function buildInitialGreeting() {
    return "¡Bienvenido! Recibe asesoría técnica automotriz confiable para tu vehículo: Registra tu auto y realizaremos un diagnóstico rápido, priorizando la reducción de fallas costosas mediante verificaciones y mantenimiento preventivo, y te generaremos un plan personalizado de mantenimiento junto con la conexión directa a talleres certificados en tu zona. Todo en pocos pasos sencillos. ¿Listo para empezar?";
}
//# sourceMappingURL=loader.js.map