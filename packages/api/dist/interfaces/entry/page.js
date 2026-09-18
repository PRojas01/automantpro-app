// HTML de la página de entrada (docs/33 §1.2). Todo en línea: el servidor se empaqueta en un
// único server.mjs, así que no se leen archivos del disco ni se usan CDNs externos.
/**
 * Opciones del menú de inicio. Cada una abre el chat con la intención escrita, para que la
 * conversación arranque sin preguntar el perfil (docs/41).
 */
export const ENTRY_PROFILES = [
    { key: "dueno", label: "Tengo un vehículo", emoji: "🚗", intent: "soy dueño de un vehículo" },
    { key: "taller", label: "Tengo un taller", emoji: "🔧", intent: "tengo un taller" },
    { key: "almacen", label: "Tengo un almacén de repuestos", emoji: "📦", intent: "tengo un almacén de repuestos" },
    { key: "cuenta", label: "Ya tengo cuenta", emoji: "🔑", intent: "ya tengo cuenta" },
];
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
    const intent = ENTRY_PROFILES.find((p) => p.key === profile)?.intent;
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
:root{--bg:#f5f8fa;--card:#ffffff;--text:#0f1b24;--muted:#51626f;--cyan:#00a8c6;--green:#16a34a;--ring:rgba(0,168,198,.35)}
@media (prefers-color-scheme:dark){:root{--bg:#071116;--card:#0d1c24;--text:#e6f1f5;--muted:#9fb3bf;--cyan:#22d3ee;--green:#4ade80;--ring:rgba(34,211,238,.35)}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,sans-serif;padding:24px}
main{width:100%;max-width:460px;background:var(--card);border-radius:20px;padding:32px 24px;box-shadow:0 10px 40px rgba(0,0,0,.08);text-align:center}
.brand{font-weight:800;font-size:28px;letter-spacing:-.5px;margin:0}
.brand span{color:var(--cyan)}
.lead{font-size:20px;margin:8px 0 20px}
ul{list-style:none;padding:0;margin:0 0 28px;text-align:left;display:grid;gap:10px}
li{padding-left:28px;position:relative;color:var(--muted)}
li::before{content:"✓";position:absolute;left:4px;color:var(--green);font-weight:700}
.cta{display:block;width:100%;min-height:56px;border:0;border-radius:14px;background:var(--green);color:#fff;font-size:19px;font-weight:700;cursor:pointer}
.cta:focus-visible{outline:4px solid var(--ring);outline-offset:2px}
.cta:disabled{background:var(--muted);cursor:not-allowed}
.small{margin-top:18px;font-size:14px;color:var(--muted)}
.small a{color:var(--cyan)}
.soon{margin-top:14px;font-weight:600}
.menu{display:grid;gap:10px}
.option{display:flex;align-items:center;gap:10px;min-height:56px;padding:0 18px;border-radius:14px;background:var(--green);color:#fff;font-size:18px;font-weight:700;text-decoration:none}
.option:nth-child(4){background:var(--cyan)}
.option:focus-visible{outline:4px solid var(--ring);outline-offset:2px}
.legal{margin-top:22px;font-size:12px;color:var(--muted)}
`;
const SCRIPT = `
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
export function renderEntryPage(input) {
    const nonce = escapeHtml(input.nonce);
    const available = input.number !== null;
    const links = available ? buildLinks(input.number, input.code, input.ref) : null;
    const refQuery = input.ref ? `&amp;ref=${escapeHtml(input.ref)}` : "";
    const menu = links
        ? `<div class="menu">${ENTRY_PROFILES.map((profile) => `<a class="option" href="/?perfil=${escapeHtml(profile.key)}${refQuery}"><span aria-hidden="true">${profile.emoji}</span> ${escapeHtml(profile.label)}</a>`).join("")}</div>
    <p class="small">Se abre WhatsApp con tu respuesta escrita. Escríbenos al <strong>${escapeHtml(formatNumber(input.number))}</strong>.</p>
    <p class="small">Tu código de inicio: <strong>${escapeHtml(input.code)}</strong></p>`
        : "";
    const button = links
        ? `<button id="abrir" class="cta" type="button" data-app="${escapeHtml(links.app)}" data-wame="${escapeHtml(links.wame)}" data-web="${escapeHtml(links.web)}">Abrir WhatsApp</button>
    <p class="small">Escríbenos al <strong>${escapeHtml(formatNumber(input.number))}</strong> · <a href="${escapeHtml(links.wame)}" rel="noopener">abrir enlace</a> · <a href="${escapeHtml(links.app)}">WhatsApp Desktop</a></p>
    <p class="small">Tu código de inicio: <strong>${escapeHtml(input.code)}</strong></p>`
        : `<button id="abrir" class="cta" type="button" disabled>Abrir WhatsApp</button>
    <p class="soon">Muy pronto disponible por WhatsApp</p>`;
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AutoMantPro · Tu mecánico de confianza en WhatsApp</title>
<meta name="description" content="Diagnóstico con IA, plan de mantenimiento y talleres verificados, todo por WhatsApp.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://automantpro.app/">
<meta property="og:title" content="AutoMantPro · Tu mecánico de confianza en WhatsApp">
<meta property="og:description" content="Plan de mantenimiento, talleres verificados y repuestos, todo por WhatsApp.">
<style nonce="${nonce}">${STYLES}</style>
</head>
<body>
<main>
  <h1 class="brand">Auto<span>Mant</span>Pro</h1>
  <p class="lead">Tu mecánico de confianza, en WhatsApp</p>
  <ul>
    <li>Diagnóstico de tu vehículo con IA</li>
    <li>Plan de mantenimiento a tu medida</li>
    <li>Talleres y repuestos verificados cerca de ti</li>
  </ul>
  ${input.menu && links ? menu : button}
  <p class="legal">Al escribirnos aceptas los <a href="/terminos">términos y condiciones</a> y la <a href="/privacidad">política de privacidad</a> (LOPDP).</p>
</main>
<script nonce="${nonce}">${SCRIPT}</script>
</body>
</html>`;
}
//# sourceMappingURL=page.js.map