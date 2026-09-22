import { STYLES, buildLinks, escapeHtml as e } from "../entry/page.js";
// Páginas de contenido (servicios y ciudades). Mismo lenguaje visual que la portada y el mismo
// servidor de un solo archivo: nada de plantillas ni recursos externos.
const SITE = "https://automantpro.app";
function structuredData(input) {
    const datos = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: input.breadcrumb.map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: item.label,
                    item: `${SITE}${item.href}`,
                })),
            },
            {
                "@type": "FAQPage",
                mainEntity: input.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
            },
        ],
    };
    return JSON.stringify(datos);
}
export function renderContentPage(input) {
    const nonce = e(input.nonce);
    const links = input.number ? buildLinks(input.number, input.code, null) : null;
    const wame = links ? `${links.wame.split("?text=")[0]}?text=${encodeURIComponent(`${input.chatText} Código: ${input.code}`)}` : null;
    const cta = wame
        ? `<a class="cta" href="${e(wame)}" rel="noopener">Escribir por WhatsApp</a>
       <p class="small linea"><span class="code">${e(input.code)}</span> <em class="nota">identifica tu visita en el chat</em></p>`
        : `<p class="soon">Muy pronto disponible por WhatsApp</p>`;
    const bloques = input.blocks.map((b) => `<section class="card"><h2 class="titulo">${e(b.title)}</h2>${b.html}</section>`).join("");
    const faq = input.faq.length
        ? `<section class="card"><h2 class="titulo">Preguntas frecuentes</h2>
      ${input.faq.map((item) => `<h3 class="pregunta">${e(item.q)}</h3><p class="respuesta">${e(item.a)}</p>`).join("")}</section>`
        : "";
    const related = input.related.length
        ? `<section class="card"><h2 class="titulo">También te puede servir</h2>
      <ul class="enlaces">${input.related.map((r) => `<li><a href="${e(r.href)}">${e(r.label)}</a></li>`).join("")}</ul></section>`
        : "";
    const migas = `<nav class="migas">${input.breadcrumb
        .map((item, index) => (index === input.breadcrumb.length - 1 ? `<span>${e(item.label)}</span>` : `<a href="${e(item.href)}">${e(item.label)}</a> ›`))
        .join(" ")}</nav>`;
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0092ad">
<title>${e(input.title)}</title>
<meta name="description" content="${e(input.description)}">
<meta name="robots" content="index,follow,max-snippet:-1">
<link rel="canonical" href="${SITE}${e(input.path)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}${e(input.path)}">
<meta property="og:title" content="${e(input.title)}">
<meta property="og:description" content="${e(input.description)}">
<meta property="og:site_name" content="AutoMantPro">
<meta property="og:locale" content="es_EC">
<style nonce="${nonce}">${STYLES}${EXTRA}</style>
<script type="application/ld+json" nonce="${nonce}">${structuredData(input)}</script>
</head>
<body>
<main>
  <header><a class="logo" href="/"><span class="mark"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5a3.5 3.5 0 0 0 4.6 4.6L21 12l-9 9-3-3 9-9-2.1-1.9a3.5 3.5 0 0 1-1.4-1.6z"/><path d="M7 4l2.5 2.5L7.5 8.5 5 6z"/></svg></span>
  <span class="brand">Auto<span>Mant</span>Pro<small>Tu asistente inteligente de mantenimiento automotriz</small></span></a></header>
  ${migas}
  <h1>${e(input.h1)}</h1>
  <p class="lead">${e(input.intro)}</p>
  ${cta}
  ${bloques}
  ${faq}
  ${related}
  <p class="legal">Al escribirnos aceptas los <a href="/terminos">términos</a> y la <a href="/privacidad">privacidad</a> (LOPDP).</p>
</main>
</body>
</html>`;
}
/** Estilos propios de las páginas de contenido, sobre los de la portada. */
const EXTRA = `
main{max-width:640px}
h1{font-size:26px;margin:10px 0 8px}
.migas{font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.6px;color:var(--muted);margin:0 0 6px}
.migas a{color:var(--cyan);text-decoration:none}
.lead{margin:0 0 16px}
.titulo{font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;color:var(--cyan);margin:0 0 12px}
.cta{display:flex;text-decoration:none;margin-bottom:10px}
.servicio{border-top:1px solid var(--line);padding:12px 0 0;margin:12px 0 0}
.servicio:first-of-type{border-top:0;padding-top:0;margin-top:0}
.servicio h3{font-size:15px;margin:0 0 4px}
.servicio p{font-size:13.5px;color:var(--muted);margin:0 0 6px}
.datos{display:flex;gap:8px;flex-wrap:wrap;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.4px}
.datos span{background:rgba(34,211,238,.10);border:1px solid rgba(34,211,238,.28);color:var(--cyan);padding:5px 8px;border-radius:7px}
.enlaces{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.enlaces a{color:var(--cyan);text-decoration:none;font-weight:600}
.zonas{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0}
.zonas span{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);border:1px solid var(--line);padding:5px 8px;border-radius:7px}
`;
export function serviceBlocks(page) {
    const items = page.items
        .map((item) => `<article class="servicio"><h3>${e(item.name)}</h3>
      ${item.detail ? `<p>${e(item.detail)}</p>` : ""}
      <div class="datos">
        ${item.durationMin ? `<span>${item.durationMin} min</span>` : ""}
        ${item.costRefUsd !== null ? `<span>desde US$ ${item.costRefUsd.toFixed(0)}</span>` : ""}
      </div>
      ${item.costNote ? `<p>${e(item.costNote)}</p>` : ""}</article>`)
        .join("");
    return [
        { title: "Qué incluye", html: items },
        {
            title: "Cómo se agenda",
            html: `<ol class="steps"><li>Nos escribes por WhatsApp con la marca, el modelo, el año y el kilometraje.</li>
      <li>Te decimos qué corresponde, cuánto demora y el precio antes de entrar al taller.</li>
      <li>Coordinamos el turno y, al terminar, el trabajo queda en el historial de tu vehículo.</li></ol>`,
        },
    ];
}
export function cityBlocks(city) {
    return [
        {
            title: `Cómo funciona en ${city.name}`,
            html: `<ol class="steps"><li>Cuentas por WhatsApp qué le pasa a tu vehículo y en qué zona estás.</li>
      <li>Te proponemos talleres cercanos; con Premium, talleres verificados con precio acordado.</li>
      <li>Agendas el turno y el trabajo queda con orden, garantía e historial.</li></ol>
      <div class="zonas">${city.zones.map((z) => `<span>${e(z)}</span>`).join("")}</div>`,
        },
        {
            title: "Qué revisamos antes de recomendar un taller",
            html: `<ul class="enlaces"><li>RUC y dirección verificados</li><li>Servicios que realmente atiende</li>
      <li>Orden de trabajo con presupuesto aprobado por el dueño</li><li>Garantía y respuesta si algo sale mal</li></ul>`,
        },
    ];
}
//# sourceMappingURL=page.js.map