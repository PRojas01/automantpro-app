// HTML de la página de entrada (docs/33 §1.2). Todo en línea: el servidor se empaqueta en un
// único server.mjs, así que no se leen archivos del disco ni se usan CDNs externos.
/**
 * Opciones del menú de inicio. Cada una abre el chat con la intención escrita, para que la
 * conversación arranque sin preguntar el perfil (docs/41).
 */
export const ENTRY_PROFILES = [
    {
        key: "dueno",
        label: "Tengo un vehículo",
        emoji: "🚗",
        hint: "Plan, síntomas y turnos",
        icon: "auto",
        intent: "soy dueño de un vehículo",
    },
    {
        key: "taller",
        label: "Tengo un taller",
        emoji: "🔧",
        hint: "Clientes, agenda y órdenes",
        icon: "taller",
        intent: "tengo un taller",
    },
    {
        key: "almacen",
        label: "Tengo un almacén de repuestos",
        emoji: "📦",
        hint: "Cotizaciones y pedidos",
        icon: "caja",
        intent: "tengo un almacén de repuestos",
    },
    {
        key: "cuenta",
        label: "Ya tengo cuenta",
        emoji: "🔑",
        hint: "Retoma tu conversación",
        icon: "llave",
        intent: "ya tengo cuenta",
    },
    // Sin intención: abre el chat con el mensaje general, para quien solo quiere escribir.
    {
        key: "chat",
        label: "Solo quiero escribir",
        emoji: "💬",
        hint: "Cuéntanos con tus palabras",
        icon: "chat",
        intent: null,
    },
];
/** Iconos en línea (sin archivos ni CDNs: el servidor es un único archivo). */
const ICONS = {
    auto: '<path d="M4 15h16M6 15l1.6-5.2A2 2 0 0 1 9.5 8.4h5a2 2 0 0 1 1.9 1.4L18 15M4 15v3h3v-3M17 15v3h3v-3"/><circle cx="8" cy="15" r="1.4"/><circle cx="16" cy="15" r="1.4"/>',
    taller: '<path d="M14.5 5.5a3.5 3.5 0 0 0 4.6 4.6L21 12l-9 9-3-3 9-9-2.1-1.9a3.5 3.5 0 0 1-1.4-1.6z"/><path d="M7 4l2.5 2.5L7.5 8.5 5 6z"/>',
    caja: '<path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5z"/><path d="M3.5 8.5 12 13l8.5-4.5M12 13v7"/>',
    llave: '<circle cx="8" cy="8" r="3.5"/><path d="M10.5 10.5 20 20M16 16l2-2M13.5 13.5l2-2"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    luna: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    chat: '<path d="M4.5 6.5h15v9h-9l-4 3.5v-3.5h-2z"/>',
    auto_hero: '<path d="M6 34h52M12 34l4.5-13a6 6 0 0 1 5.7-4.1h19.6a6 6 0 0 1 5.7 4.1L52 34M12 34v7h6v-7M46 34v7h6v-7M22 21h20"/><circle cx="19" cy="34" r="3.4"/><circle cx="45" cy="34" r="3.4"/>',
    escudo: '<path d="M12 3.5 5.5 6v6c0 3.6 2.7 6.9 6.5 8.5 3.8-1.6 6.5-4.9 6.5-8.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    rayo: '<path d="M13 3.5 6.5 13.5h4L10 20.5 17.5 10h-4z"/>',
    persona: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 20c.9-3.4 3.5-5 6.5-5s5.6 1.6 6.5 5"/>',
};
const icon = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.chat}</svg>`;
export function sanitizeProfile(value) {
    return typeof value === "string" && ENTRY_PROFILES.some((p) => p.key === value) ? value : null;
}
export function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
export function buildLinks(number, code, ref, profile = null) {
    const intent = ENTRY_PROFILES.find((p) => p.key === profile)?.intent ?? null;
    const text = `Hola AutoMantPro, ${intent ?? "quiero empezar"}. Código: ${code}${ref ? ` (ref: ${ref})` : ""}`;
    const encoded = encodeURIComponent(text);
    return {
        text,
        app: `whatsapp://send?phone=${number}&text=${encoded}`,
        wame: `https://wa.me/${number}?text=${encoded}`,
        web: `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`,
    };
}
function formatNumber(number) {
    // 593XXXXXXXXX → +593 XX XXX XXXX (solo para mostrar)
    if (number.startsWith("593") && number.length === 12) {
        return `+593 ${number.slice(3, 5)} ${number.slice(5, 8)} ${number.slice(8)}`;
    }
    return `+${number}`;
}
const STYLES = `
:root{
  --bg:#05090e;--panel:rgba(255,255,255,.045);--text:#e8f6fb;--muted:#9bb3c2;
  --line:rgba(120,200,225,.18);--cyan:#22d3ee;--cyan-deep:#0891b2;--lime:#a3e635;--amber:#fbbf24;
  --grid:rgba(34,211,238,.07);--halo:rgba(34,211,238,.20);--glow:0 0 0 1px rgba(34,211,238,.25),0 12px 40px rgba(8,145,178,.22);
  --cta-text:#04141a;color-scheme:dark
}
/* Tema claro: por preferencia del teléfono o por el botón del encabezado. */
@media (prefers-color-scheme:light){
  :root:not([data-tema="oscuro"]){
    --bg:#f4f8fb;--panel:rgba(255,255,255,.85);--text:#08171f;--muted:#516676;
    --line:rgba(8,116,140,.18);--cyan:#0e7f96;--cyan-deep:#0b6377;--lime:#3f7a15;--amber:#a45f05;
    --grid:rgba(14,127,150,.09);--halo:rgba(14,127,150,.14);--glow:0 0 0 1px rgba(14,127,150,.2),0 12px 30px rgba(8,116,140,.14);
    --cta-text:#ffffff;color-scheme:light
  }
}
:root[data-tema="claro"]{
  --bg:#f4f8fb;--panel:rgba(255,255,255,.85);--text:#08171f;--muted:#516676;
  --line:rgba(8,116,140,.18);--cyan:#0e7f96;--cyan-deep:#0b6377;--lime:#3f7a15;--amber:#a45f05;
  --grid:rgba(14,127,150,.09);--halo:rgba(14,127,150,.14);--glow:0 0 0 1px rgba(14,127,150,.2),0 12px 30px rgba(8,116,140,.14);
  --cta-text:#ffffff;color-scheme:light
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;min-height:100vh;color:var(--text);background:var(--bg);
  font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,sans-serif;
  display:flex;flex-direction:column;align-items:center;position:relative;overflow-x:hidden;
  -webkit-tap-highlight-color:rgba(34,211,238,.18);
  padding:calc(12px + env(safe-area-inset-top)) calc(14px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left))
}
/* Retícula tenue y resplandor: el "HUD" del tablero, sin imágenes ni archivos externos. */
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:46px 46px;
  -webkit-mask-image:radial-gradient(75% 55% at 50% 0%,#000 25%,transparent 100%);
  mask-image:radial-gradient(75% 55% at 50% 0%,#000 25%,transparent 100%)
}
body::after{
  content:"";position:fixed;left:50%;top:-220px;width:760px;height:420px;transform:translateX(-50%);pointer-events:none;z-index:0;
  background:radial-gradient(closest-side,var(--halo),transparent 75%);filter:blur(4px)
}
main{width:100%;max-width:540px;position:relative;z-index:1}
header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:2px 0 18px}
.logo{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}
.mark{
  width:42px;height:42px;flex:none;display:grid;place-items:center;color:#041016;
  background:linear-gradient(145deg,var(--cyan),var(--cyan-deep));
  clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);
  box-shadow:0 0 22px rgba(34,211,238,.45)
}
.mark svg{width:23px;height:23px;stroke-width:1.9}
.brand{font-weight:800;font-size:19px;letter-spacing:.2px;margin:0;line-height:1.1;text-transform:uppercase}
.brand span{color:var(--cyan)}
.brand small{display:block;font:500 11px/1.35 system-ui,-apple-system,sans-serif;color:var(--muted);letter-spacing:.2px;text-transform:none;margin-top:3px;max-width:22ch}
.acciones{display:flex;align-items:center;gap:8px;margin-left:auto}
.tema{
  width:38px;height:38px;flex:none;display:grid;place-items:center;cursor:pointer;color:var(--cyan);
  background:var(--panel);border:1px solid var(--line);border-radius:11px;font:inherit
}
.tema:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.tema svg{width:19px;height:19px}
.tema .sol{display:none}
:root[data-tema="claro"] .tema .sol,:root:not([data-tema="oscuro"]) .tema .sol{display:block}
:root[data-tema="claro"] .tema .luna,:root:not([data-tema="oscuro"]) .tema .luna{display:none}
@media (prefers-color-scheme:dark){:root:not([data-tema="claro"]) .tema .sol{display:none}:root:not([data-tema="claro"]) .tema .luna{display:block}}
:root[data-tema="oscuro"] .tema .sol{display:none}
:root[data-tema="oscuro"] .tema .luna{display:block}
.pill{
  font:700 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;
  color:var(--lime);background:rgba(163,230,53,.10);border:1px solid rgba(163,230,53,.35);padding:7px 10px;border-radius:999px
}
h1{font-size:25px;line-height:1.16;letter-spacing:-.4px;margin:0 0 8px;text-wrap:balance}
h1 em{font-style:normal;color:var(--cyan);text-shadow:0 0 18px rgba(34,211,238,.45)}
.lead{font-size:14px;color:var(--muted);margin:0;max-width:46ch}
.hero{position:relative;overflow:hidden;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px 14px 12px;margin:0 0 9px;backdrop-filter:blur(6px)}
.hero::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:.8}
.hero .silueta{position:absolute;right:-18px;bottom:-16px;width:180px;color:var(--cyan);opacity:.11;pointer-events:none}
.hero h1{position:relative}
.hero .lead{position:relative}
.trust{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;padding:8px 12px;list-style:none;background:var(--panel);border:1px solid var(--line);border-radius:12px;backdrop-filter:blur(6px)}
.trust li{display:flex;align-items:baseline;gap:5px}
.trust b{font:800 15px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--cyan);letter-spacing:-.4px}
.trust span{font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)}
.consola{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:rgba(34,211,238,.06);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:0 0 16px;font-size:14px;color:var(--muted)}
.consola .punto{width:8px;height:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 10px var(--lime);flex:none}
.section{font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:var(--cyan);margin:0 0 9px;display:flex;align-items:center;gap:10px}
.section em{font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.4px;text-transform:none;color:var(--muted);font-style:normal}
.section::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.menu{display:grid;gap:7px;margin:0 0 8px}
.option{
  position:relative;display:flex;align-items:center;gap:12px;min-height:56px;padding:9px 14px;text-decoration:none;color:inherit;
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));border:1px solid var(--line);border-radius:14px;
  overflow:hidden;transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease
}
.option::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,var(--cyan),transparent);opacity:.7}
.option:hover{transform:translateY(-1px);border-color:rgba(34,211,238,.55);box-shadow:var(--glow)}
.option:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
.badge{
  width:40px;height:40px;flex:none;display:grid;place-items:center;color:var(--cyan);
  background:rgba(34,211,238,.10);border:1px solid rgba(34,211,238,.28);
  clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)
}
.option .ico{width:23px;height:23px}
.option b{display:block;font-size:15px;line-height:1.25;letter-spacing:-.2px}
.option i{display:block;font-style:normal;font-size:12.5px;color:var(--muted);margin-top:2px}
.option .go{margin-left:auto;flex:none;color:var(--cyan);font-size:20px;line-height:1;opacity:.75}
.option.ghost{background:transparent;border-style:dashed;min-height:52px}
.option.ghost::before{background:linear-gradient(180deg,var(--muted),transparent);opacity:.4}
.option.ghost .badge{background:transparent;border-color:var(--line);color:var(--muted)}
.cta{
  display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:60px;border:0;border-radius:14px;cursor:pointer;
  background:linear-gradient(135deg,var(--cyan),var(--cyan-deep));color:#04141a;font:800 18px/1 inherit;font-family:inherit;
  letter-spacing:.3px;box-shadow:0 10px 30px rgba(34,211,238,.3)
}
.cta:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
.cta:disabled{background:rgba(255,255,255,.08);color:var(--muted);box-shadow:none;cursor:not-allowed}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:0 0 12px;backdrop-filter:blur(6px)}
.card>summary{
  list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;
  font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:var(--cyan)
}
.card>summary::-webkit-details-marker{display:none}
.card>summary::after{content:"+";font-size:16px;line-height:1;color:var(--muted)}
.card[open]>summary::after{content:"−"}
.card[open]>summary{margin-bottom:11px}
.card>summary:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
.steps{list-style:none;counter-reset:s;margin:0;padding:0;display:grid;gap:12px}
.steps li{counter-increment:s;display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:var(--muted)}
.pregunta{font-size:14px;margin:12px 0 4px;line-height:1.3}
.respuesta{font-size:13.5px;color:var(--muted);margin:0}
.steps li::before{
  content:"0" counter(s);flex:none;font:800 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--cyan);
  background:rgba(34,211,238,.10);border:1px solid rgba(34,211,238,.3);border-radius:6px;padding:6px 7px
}
.small{font-size:13px;color:var(--muted);margin:0 0 8px}
.small.linea{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px}
.nota{font:500 11px/1.2 system-ui,-apple-system,sans-serif;font-style:normal;color:var(--muted);opacity:.9}
.small.spaced{margin-top:16px}
.small a{color:var(--cyan);font-weight:600;text-decoration:none;border-bottom:1px solid rgba(34,211,238,.35)}
.code{font:700 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(34,211,238,.10);border:1px solid rgba(34,211,238,.3);color:var(--cyan);padding:5px 9px;border-radius:7px;letter-spacing:1.2px}
.soon{margin-top:14px;font-weight:600;text-align:center;color:var(--amber)}
.legal{font-size:11.5px;color:var(--muted);margin:6px 0 0;text-align:center;opacity:.85}
.legal a{color:var(--cyan)}
@media (prefers-reduced-motion:reduce){.option{transition:none}}
@media (max-width:360px){h1{font-size:23px}.option i{display:none}}
/* Pantallas bajas: se recorta lo accesorio para que todo quepa sin desplazar. */
@media (max-height:700px){
  h1{font-size:22px}.lead{display:none}.trust{margin-bottom:10px}
  .option{min-height:58px}.option i{display:none}.hero{padding:12px 14px}
}
`;
/** Se ejecuta antes de pintar, para que no parpadee el tema al cargar. */
const THEME_BOOT = `
(function(){try{var t=localStorage.getItem('amp-tema');if(t==='claro'||t==='oscuro'){document.documentElement.setAttribute('data-tema',t);}}catch(e){}})();
`;
const SCRIPT = `
(function(){
  var boton=document.getElementById('tema');
  if(boton){
    var raiz=document.documentElement;
    var oscuroDelSistema=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
    var actual=function(){return raiz.getAttribute('data-tema')||(oscuroDelSistema?'oscuro':'claro');};
    var aplicar=function(t){
      raiz.setAttribute('data-tema',t);
      boton.setAttribute('aria-label',t==='oscuro'?'Cambiar a tema claro':'Cambiar a tema oscuro');
      try{localStorage.setItem('amp-tema',t);}catch(e){}
    };
    boton.setAttribute('aria-label',actual()==='oscuro'?'Cambiar a tema claro':'Cambiar a tema oscuro');
    boton.addEventListener('click',function(){aplicar(actual()==='oscuro'?'claro':'oscuro');});
  }
})();
(function(){
  var b=document.getElementById('abrir');
  if(!b||b.disabled)return;
  b.addEventListener('click',function(){
    var mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
    if(mobile){
      var start=Date.now();
      window.location.href=b.getAttribute('data-app');
      setTimeout(function(){
        if(document.visibilityState==='visible'&&Date.now()-start<2500){window.location.href=b.getAttribute('data-wame');}
      },1200);
    }else{
      var w=window.open(b.getAttribute('data-web'),'_blank','noopener');
      if(!w){window.location.href=b.getAttribute('data-wame');}
    }
  });
})();
`;
/**
 * Datos estructurados (schema.org) para buscadores y asistentes de IA: qué es el servicio, dónde
 * opera y qué preguntas responde. Es lo que se cita en los resultados enriquecidos (docs/44).
 */
function structuredData(input) {
    const site = "https://automantpro.app";
    const telefono = input.number ? `+${input.number}` : undefined;
    const datos = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${site}/#organizacion`,
                name: "AutoMantPro",
                url: site,
                description: "Mantenimiento automotor por WhatsApp en Ecuador: plan por vehículo, talleres verificados y repuestos.",
                areaServed: { "@type": "Country", name: "Ecuador" },
                ...(telefono ? { telephone: telefono, contactPoint: { "@type": "ContactPoint", telephone: telefono, contactType: "customer service", availableLanguage: "es" } } : {}),
            },
            {
                "@type": "Service",
                name: "Mantenimiento y reparación de vehículos por WhatsApp",
                serviceType: "Mantenimiento automotor, diagnóstico, talleres mecánicos y repuestos",
                provider: { "@id": `${site}/#organizacion` },
                areaServed: { "@type": "Country", name: "Ecuador" },
                offers: {
                    "@type": "Offer",
                    priceCurrency: "USD",
                    description: "Plan gratuito con mantenimiento y talleres cercanos; plan Premium con talleres verificados, cotizaciones y garantía.",
                },
            },
            {
                "@type": "FAQPage",
                mainEntity: FAQ.map((item) => ({
                    "@type": "Question",
                    name: item.q,
                    acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
            },
        ],
    };
    return JSON.stringify(datos);
}
/** Preguntas frecuentes: sirven al visitante y son lo que citan los buscadores y las IA. */
const FAQ = [
    {
        q: "¿Cómo pido mantenimiento para mi carro en Ecuador?",
        a: "Escribes por WhatsApp a AutoMantPro con la marca, el modelo y el kilometraje, y recibes el plan de mantenimiento que le toca a tu vehículo y el turno en un taller cercano.",
    },
    {
        q: "¿Cómo encuentro un taller mecánico de confianza cerca de mí?",
        a: "AutoMantPro busca talleres cercanos y, con el plan Premium, te conecta con talleres verificados: precio acordado antes de entrar, orden de trabajo y garantía respaldada.",
    },
    {
        q: "¿Puedo cotizar repuestos sin recorrer almacenes?",
        a: "Sí. Se pide el repuesto una vez y varios almacenes responden con precio, marca, garantía y tiempo de entrega para comparar en el mismo chat.",
    },
    {
        q: "¿Necesito instalar una aplicación?",
        a: "No. Todo ocurre dentro de WhatsApp: no hay que instalar nada ni crear contraseñas.",
    },
    {
        q: "¿Cuánto cuesta?",
        a: "Hay un plan gratuito con el plan de mantenimiento, recordatorios y búsqueda de talleres cercanos. El plan Premium agrega talleres verificados, cotizaciones a varios almacenes, garantía respaldada e historial exportable.",
    },
];
export function renderEntryPage(input) {
    const nonce = escapeHtml(input.nonce);
    const available = input.number !== null;
    const links = available ? buildLinks(input.number, input.code, input.ref) : null;
    const number = available ? escapeHtml(formatNumber(input.number)) : "";
    const refQuery = input.ref ? `&amp;ref=${escapeHtml(input.ref)}` : "";
    const logo = `<a class="logo" href="/?pagina=1">
    <span class="mark">${icon("taller", "")}</span>
    <span class="brand">Auto<span>Mant</span>Pro<small>Tu taller de confianza, en WhatsApp</small></span>
  </a>`;
    const trust = `<ul class="trust">
    <li><b>0</b><span>apps</span></li>
    <li><b>90</b><span>días gratis</span></li>
    <li><b>100%</b><span>verificados</span></li>
  </ul>`;
    const faq = `<details class="card"><summary>Preguntas frecuentes</summary>
    ${FAQ.map((item) => `<h3 class="pregunta">${escapeHtml(item.q)}</h3><p class="respuesta">${escapeHtml(item.a)}</p>`).join("")}
    </details>`;
    const steps = `<details class="card"><summary>Cómo funciona</summary><ol class="steps">
    <li>Nos escribes por WhatsApp y nos cuentas qué necesitas.</li>
    <li>Te respondemos con tu plan, el diagnóstico o el precio.</li>
    <li>Agendas en un taller verificado o cotizas el repuesto, en el mismo chat.</li>
  </ol></details>`;
    const contact = links
        ? `<p class="small linea"><a href="${escapeHtml(links.wame)}" rel="noopener">${number}</a> · <span class="code">${escapeHtml(input.code)}</span> <em class="nota">identifica tu visita en el chat</em></p>`
        : "";
    const menu = links
        ? `<p class="section">¿Con qué empezamos?</p>
    <div class="menu">${ENTRY_PROFILES.map((profile) => `<a class="option${profile.intent === null ? " ghost" : ""}" href="/?perfil=${escapeHtml(profile.key)}${refQuery}">
        <span class="badge">${icon(profile.icon)}</span>
        <span><b>${escapeHtml(profile.label)}</b><i>${escapeHtml(profile.hint)}</i></span>
        <span class="go" aria-hidden="true">›</span>
      </a>`).join("")}</div>
    ${contact}`
        : "";
    const button = links
        ? `<button id="abrir" class="cta" type="button" data-app="${escapeHtml(links.app)}" data-wame="${escapeHtml(links.wame)}" data-web="${escapeHtml(links.web)}">Abrir WhatsApp</button>
    <p class="small spaced">Escríbenos al <strong>${number}</strong> · <a href="${escapeHtml(links.wame)}" rel="noopener">abrir enlace</a> · <a href="${escapeHtml(links.app)}">WhatsApp Desktop</a> · <a href="${escapeHtml(links.web)}" rel="noopener">WhatsApp Web</a></p>
    <p class="small"><span class="code">${escapeHtml(input.code)}</span> <em class="nota">identifica tu visita en el chat</em></p>`
        : `<button id="abrir" class="cta" type="button" disabled>Abrir WhatsApp</button>
    <p class="soon">Muy pronto disponible por WhatsApp</p>`;
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0092ad">
<title>AutoMantPro · Mantenimiento, talleres y repuestos por WhatsApp en Ecuador</title>
<meta name="description" content="Mantenimiento y reparación de tu vehículo por WhatsApp en Ecuador: plan de mantenimiento a la medida, diagnóstico con IA, talleres mecánicos verificados y cotización de repuestos. Sin instalar nada.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://automantpro.app/">
<meta property="og:title" content="AutoMantPro · Tu mecánico de confianza en WhatsApp">
<meta property="og:description" content="Plan de mantenimiento, talleres verificados y repuestos, todo por WhatsApp.">
<meta property="og:site_name" content="AutoMantPro">
<meta property="og:locale" content="es_EC">
<meta name="twitter:card" content="summary">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<meta name="author" content="AutoMantPro">
<link rel="canonical" href="https://automantpro.app/">
<script type="application/ld+json" nonce="${nonce}">${structuredData(input)}</script>
<style nonce="${nonce}">${STYLES}</style>
<script nonce="${nonce}">${THEME_BOOT}</script>
</head>
<body>
<main>
  <header>${logo}
    <span class="acciones">
      <span class="pill">90 días gratis</span>
      <button id="tema" class="tema" type="button" aria-label="Cambiar de tema">${icon("sol", "sol")}${icon("luna", "luna")}</button>
    </span>
  </header>
  <section class="hero">
    <svg class="silueta" viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS.auto_hero}</svg>
    <h1>Tu vehículo, tu taller y tus repuestos en <em>un solo chat</em></h1>
    <p class="lead">Mantenimiento, diagnóstico con IA y talleres verificados. Todo por WhatsApp.</p>
  </section>
  ${trust}
  ${input.menu && links ? menu : button}
  ${steps}
  ${faq}
  <p class="legal">Aceptas los <a href="/terminos">términos</a> y la <a href="/privacidad">privacidad</a> (LOPDP).</p>
</main>
<script nonce="${nonce}">${SCRIPT}</script>
</body>
</html>`;
}
//# sourceMappingURL=page.js.map