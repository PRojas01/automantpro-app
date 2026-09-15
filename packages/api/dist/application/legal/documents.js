import { CONSENT_VERSION } from "../registration/schemas.js";
// Términos y condiciones y política de privacidad (docs/11 §3 y §5, docs/37). Basados en los
// contratos de business/legal, adaptados a la aceptación por WhatsApp y a los planes de docs/29.
// Los datos de la empresa se editan en Ajustes; mientras falten se muestran como pendientes.
export const LEGAL_VERSION = CONSENT_VERSION;
export const LEGAL_EFFECTIVE_DATE = "15 de septiembre de 2026";
export const LEGAL_FIELDS = [
    { key: "razonSocial", label: "Razón social", placeholder: "Nombre legal de la empresa" },
    { key: "ruc", label: "RUC", placeholder: "13 dígitos terminados en 001" },
    { key: "domicilio", label: "Domicilio", placeholder: "Dirección y ciudad" },
    { key: "representante", label: "Representante legal", placeholder: "Nombre y apellido" },
    { key: "correo", label: "Correo para temas legales y datos personales", placeholder: "correo@dominio" },
];
export const legalSettingKey = (key) => `legal.${key}`;
export function emptyLegalData() {
    return { razonSocial: null, ruc: null, domicilio: null, representante: null, correo: null };
}
export function isLegalComplete(data) {
    return LEGAL_FIELDS.every((f) => !!data[f.key]);
}
/** Valida un campo; devuelve el mensaje de error o null. Los vacíos se aceptan (quitan el dato). */
export function validateLegalField(key, value) {
    if (!value)
        return null;
    switch (key) {
        case "ruc":
            return /^\d{10}001$/.test(value) ? null : "RUC no válido: 13 dígitos terminados en 001.";
        case "correo":
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 191 ? null : "Correo no válido.";
        case "razonSocial":
            return value.length >= 3 && value.length <= 160 ? null : "La razón social debe tener entre 3 y 160 caracteres.";
        case "domicilio":
            return value.length >= 5 && value.length <= 200 ? null : "El domicilio debe tener entre 5 y 200 caracteres.";
        case "representante":
            return value.length >= 3 && value.length <= 120 ? null : "El nombre del representante debe tener entre 3 y 120 caracteres.";
        default:
            return null;
    }
}
/** Lee los datos legales de Ajustes con caché; si la base no responde, quedan como pendientes. */
export function createLegalLoader(settings, ttlMs = 60_000) {
    let cached = null;
    let loadedAt = 0;
    return {
        async get() {
            if (cached && Date.now() - loadedAt < ttlMs)
                return cached;
            const data = emptyLegalData();
            try {
                for (const field of LEGAL_FIELDS)
                    data[field.key] = await settings.get(legalSettingKey(field.key));
            }
            catch {
                // sin base: los datos se muestran como pendientes
            }
            cached = data;
            loadedAt = Date.now();
            return data;
        },
        invalidate() {
            cached = null;
            loadedAt = 0;
        },
    };
}
const PENDING = "[pendiente]";
function company(data) {
    return {
        name: data.razonSocial ?? PENDING,
        ruc: data.ruc ?? PENDING,
        address: data.domicilio ?? PENDING,
        representative: data.representante ?? PENDING,
        email: data.correo ?? PENDING,
    };
}
export function termsSections(data) {
    const c = company(data);
    return [
        {
            title: "1. Quiénes somos y aceptación",
            paragraphs: [
                `Estos términos regulan el uso de AutoMantPro, plataforma tecnológica operada por ${c.name}, con RUC ${c.ruc}, domicilio en ${c.address} y representada legalmente por ${c.representative} (en adelante, «AutoMantPro»).`,
                "Quien use el servicio como dueño de vehículo, taller o almacén de repuestos (en adelante, «el usuario») acepta estos términos y la política de privacidad al responder «Acepto» por WhatsApp o al confirmar su registro. La aceptación queda registrada con su fecha, la versión del documento y el canal.",
            ],
        },
        {
            title: "2. Objeto",
            paragraphs: [
                "Regular el acceso y uso de los servicios de AutoMantPro para la gestión del mantenimiento preventivo y correctivo de vehículos: registro del vehículo, plan de mantenimiento, orientación ante síntomas, búsqueda de talleres verificados, agendamiento de turnos, cotización de repuestos, historial y calificación de los servicios recibidos.",
            ],
        },
        {
            title: "3. Naturaleza de la relación",
            paragraphs: [
                "La relación es de carácter civil y mercantil. No genera relación laboral, de subordinación ni de representación entre las partes.",
                "AutoMantPro actúa como intermediario tecnológico. Los servicios mecánicos y la venta de repuestos los prestan los talleres y almacenes, bajo su propia responsabilidad.",
            ],
        },
        {
            title: "4. Servicios según el perfil",
            items: [
                "Dueño de vehículo: registro de sus vehículos, plan y alertas de mantenimiento, orientación ante síntomas, recomendación de talleres verificados cercanos, solicitud de turnos, cotización de repuestos, historial digital y calificación de servicios.",
                "Taller: perfil verificado, recepción y gestión de solicitudes de turno, órdenes de trabajo, alertas a sus clientes y reportes de desempeño.",
                "Almacén de repuestos: perfil verificado, catálogo, recepción y respuesta de solicitudes de cotización y seguimiento de pedidos.",
            ],
        },
        {
            title: "5. Obligaciones del dueño de vehículo",
            items: [
                "Proporcionar información veraz y completa sobre su vehículo.",
                "Asistir a los turnos o avisar su cancelación con anticipación.",
                "Pagar directamente al taller o almacén los servicios y repuestos que contrate.",
                "Evaluar los servicios recibidos de manera objetiva y responsable.",
                "No usar la plataforma para fines contrarios a la ley o fraudulentos.",
            ],
        },
        {
            title: "6. Obligaciones de talleres y almacenes",
            items: [
                "Superar la verificación de AutoMantPro: RUC válido, permisos de funcionamiento vigentes y, en el caso de los talleres, pólizas vigentes de responsabilidad civil y de custodia de vehículos.",
                "Prestar sus servicios con los estándares de calidad y atención de la plataforma, y cumplir las normas de higiene, seguridad, ambiente y legislación laboral vigentes.",
                "Mantener actualizada la información de su perfil, sus servicios, horarios y precios informados.",
                "Responder las solicitudes de turno en un máximo de 24 horas (talleres) y las solicitudes de cotización en un máximo de 48 horas (almacenes).",
                "Reportar la ejecución de los servicios gestionados a través de la plataforma y permitir su evaluación por parte de los clientes.",
            ],
        },
        {
            title: "7. Verificación y suspensión",
            paragraphs: [
                "Los talleres y almacenes aparecen en las búsquedas solo después de que AutoMantPro aprueba su verificación. AutoMantPro puede observar o rechazar un registro, o suspender a quien incumpla estos términos, entregue información falsa o reciba quejas reiteradas, indicando siempre el motivo.",
            ],
        },
        {
            title: "8. Prueba gratuita, planes y pagos",
            items: [
                "Cada perfil tiene una prueba gratuita de 90 días o hasta alcanzar los topes de uso de su perfil, lo que ocurra primero.",
                "Al terminar la prueba, el servicio continúa con el plan que el usuario elija. Los precios se informan en dólares, con IVA incluido, antes de contratar.",
                "En esta etapa AutoMantPro no cobra comisión a talleres ni almacenes por los servicios o ventas que se generen en la plataforma; solo cobra la suscripción del plan elegido.",
                "Los dueños de vehículo pueden cancelar su plan en cualquier momento, sin permanencia mínima.",
            ],
        },
        {
            title: "9. Limitación de responsabilidad",
            paragraphs: [
                "Las orientaciones ante síntomas, los planes de mantenimiento y los costos que muestra AutoMantPro son referenciales y no reemplazan la inspección presencial de un profesional.",
                "AutoMantPro no es responsable por fallas técnicas, daños, pérdidas, demoras o mala ejecución atribuibles a los talleres o almacenes, ni garantiza el resultado del servicio contratado con ellos. Sin embargo, verifica previamente sus permisos, seguros y reputación, y atiende los reclamos que se le presenten.",
            ],
        },
        {
            title: "10. Uso de marca e información comercial",
            paragraphs: [
                "Los talleres y almacenes autorizan a AutoMantPro a mostrar su nombre comercial, logotipo, dirección, especialidades y calificaciones dentro de la plataforma y en materiales promocionales digitales. Este uso es no exclusivo y no implica cesión de derechos.",
            ],
        },
        {
            title: "11. Confidencialidad",
            paragraphs: [
                "Las partes mantendrán la confidencialidad de la información técnica, comercial o de clientes que conozcan por el uso de la plataforma, durante la relación y hasta doce (12) meses después de terminada.",
            ],
        },
        {
            title: "12. Datos personales",
            paragraphs: [
                "El tratamiento de datos personales se rige por la Ley Orgánica de Protección de Datos Personales y por la política de privacidad publicada en automantpro.app/privacidad.",
            ],
        },
        {
            title: "13. Vigencia y terminación",
            items: [
                "Para los dueños de vehículo, estos términos rigen mientras mantengan una cuenta activa. Pueden terminar en cualquier momento pidiendo la eliminación de su cuenta.",
                "Para los talleres y almacenes, la relación dura doce (12) meses desde su aceptación y se renueva automáticamente por períodos iguales, salvo aviso escrito de cualquiera de las partes con al menos treinta (30) días de anticipación.",
                "AutoMantPro puede suspender o terminar el servicio por uso indebido o por incumplimiento de estos términos.",
            ],
        },
        {
            title: "14. Cambios a estos términos",
            paragraphs: [
                "Si estos términos cambian, se publicará una nueva versión y se avisará por WhatsApp. Para seguir usando el servicio será necesario aceptar la nueva versión.",
            ],
        },
        {
            title: "15. Ley aplicable y controversias",
            paragraphs: [
                "Estos términos se rigen por las leyes de la República del Ecuador. Cualquier controversia se tratará primero mediante diálogo directo entre las partes; si persiste, se someterá a los jueces civiles de la ciudad de Quito, conforme al Código Orgánico General de Procesos.",
            ],
        },
        {
            title: "16. Contacto",
            paragraphs: [`Por el WhatsApp oficial de AutoMantPro o al correo ${c.email}.`],
        },
    ];
}
export function privacySections(data) {
    const c = company(data);
    return [
        {
            title: "1. Responsable del tratamiento",
            paragraphs: [`${c.name}, con RUC ${c.ruc} y domicilio en ${c.address}. Contacto para datos personales: ${c.email}.`],
        },
        {
            title: "2. Datos que tratamos",
            items: [
                "Identificación y contacto: nombre, número de WhatsApp, ciudad y, si lo entregas, correo electrónico.",
                "Vehículo: clase, marca, modelo, año, combustible, kilometraje, placa (opcional) y tipo de uso.",
                "Talleres y almacenes: nombre comercial, RUC, dirección, horario, servicios o categorías y nombre del responsable.",
                "Uso del servicio: conversaciones de atención, turnos, cotizaciones, calificaciones y notas de seguimiento.",
                "Visitas a automantpro.app: un código de inicio y el origen de la visita, sin guardar tu dirección IP.",
                "Registro de tu consentimiento: fecha, versión de estos documentos y canal.",
            ],
        },
        {
            title: "3. Datos que no pedimos",
            paragraphs: [
                "No pedimos tu cédula ni datos de tarjetas por el chat, ni datos sensibles como salud, religión u orientación política. Si los envías por error, no los usaremos y los eliminaremos.",
            ],
        },
        {
            title: "4. Para qué usamos tus datos",
            items: [
                "Registrarte y prestarte el servicio según tu perfil.",
                "Calcular el plan de mantenimiento de tus vehículos y, si lo aceptas, enviarte recordatorios.",
                "Conectarte con los talleres y almacenes que elijas, agendar turnos y gestionar cotizaciones.",
                "Atender tus consultas, reclamos y solicitudes.",
                "Verificar a talleres y almacenes, prevenir fraudes y proteger la seguridad de la plataforma.",
                "Cumplir obligaciones legales y tributarias.",
                "Mejorar el servicio con información estadística que no te identifica.",
            ],
        },
        {
            title: "5. Base legal",
            items: [
                "Tu consentimiento, que otorgas al aceptar por WhatsApp y puedes retirar cuando quieras.",
                "La ejecución de la relación que tienes con AutoMantPro (turnos, cotizaciones, suscripción).",
                "El cumplimiento de obligaciones legales, como la facturación.",
            ],
        },
        {
            title: "6. Con quién compartimos tus datos",
            items: [
                "Con el taller o almacén que eliges, solo lo necesario para atenderte: tu nombre, tu vehículo, los servicios o repuestos y la fecha acordada.",
                "Con proveedores que nos prestan servicios bajo contrato y solo para esos fines: mensajería (WhatsApp, de Meta Platforms), alojamiento y base de datos, pasarela de pagos y, cuando se activen, servicios de inteligencia artificial.",
                "Algunos de esos proveedores operan fuera del Ecuador; en esos casos la transferencia se hace con las garantías que exige la LOPDP.",
                "Con autoridades competentes, cuando la ley lo exija.",
                "Nunca vendemos tus datos.",
            ],
        },
        {
            title: "7. Cuánto tiempo los conservamos",
            paragraphs: [
                "Mientras tu cuenta esté activa. Si pides eliminarla, tienes 30 días para arrepentirte; después eliminamos o anonimizamos tus datos, salvo los que la ley obligue a conservar, como los tributarios, que se guardan solo por el plazo legal. Los registros de visitas no permiten identificarte.",
            ],
        },
        {
            title: "8. Tus derechos",
            paragraphs: [
                `Puedes pedir acceso a tus datos, su rectificación o actualización, su eliminación, oponerte a su tratamiento, su portabilidad, la suspensión del tratamiento y no ser objeto de decisiones basadas solo en tratamientos automatizados. Escríbenos por el WhatsApp oficial o al correo ${c.email}; respondemos dentro de los plazos de la LOPDP.`,
                "Si no estás conforme con nuestra respuesta, puedes presentar un reclamo ante la Superintendencia de Protección de Datos Personales.",
            ],
        },
        {
            title: "9. Seguridad",
            paragraphs: [
                "Usamos conexiones cifradas (HTTPS), acceso restringido al panel de administración con contraseña y segundo factor, registros de auditoría de las acciones administrativas y registros técnicos sin datos personales.",
            ],
        },
        {
            title: "10. Menores de edad",
            paragraphs: ["AutoMantPro está dirigido a personas mayores de 18 años."],
        },
        {
            title: "11. Cambios a esta política",
            paragraphs: [
                "Si esta política cambia, publicaremos una nueva versión en automantpro.app/privacidad y te avisaremos por WhatsApp antes de aplicarla.",
            ],
        },
    ];
}
//# sourceMappingURL=documents.js.map