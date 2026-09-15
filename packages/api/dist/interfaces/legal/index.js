import { randomBytes } from "node:crypto";
import { escapeHtml } from "../entry/page.js";
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSION, emptyLegalData, isLegalComplete, privacySections, termsSections, } from "../../application/legal/documents.js";
const STYLES = `
:root{--bg:#f5f8fa;--card:#ffffff;--text:#0f1b24;--muted:#51626f;--cyan:#00a8c6;--amber:#b45309;--line:#e2e8ee}
@media (prefers-color-scheme:dark){:root{--bg:#071116;--card:#0d1c24;--text:#e6f1f5;--muted:#9fb3bf;--cyan:#22d3ee;--amber:#fbbf24;--line:#1e3440}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,sans-serif;padding:24px 16px}
main{max-width:760px;margin:0 auto;background:var(--card);border-radius:20px;padding:28px 24px;box-shadow:0 10px 40px rgba(0,0,0,.08)}
.brand{font-weight:800;font-size:22px;margin:0;text-decoration:none;color:var(--text)}.brand span{color:var(--cyan)}
h1{font-size:26px;margin:18px 0 4px}h2{font-size:18px;margin:26px 0 6px}
p,li{color:var(--text)}ul{padding-left:22px}li{margin:6px 0}
.meta{color:var(--muted);font-size:14px;margin:0 0 12px}
.notice{border:1px solid var(--amber);color:var(--amber);border-radius:12px;padding:10px 14px;font-weight:600}
a{color:var(--cyan)}nav{display:flex;gap:16px;flex-wrap:wrap;margin-top:28px;padding-top:16px;border-top:1px solid var(--line);font-size:14px}
`;
function renderSections(sections) {
    return sections
        .map((s) => {
        const paragraphs = (s.paragraphs ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
        const items = s.items ? `<ul>${s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";
        return `<h2>${escapeHtml(s.title)}</h2>${paragraphs}${items}`;
    })
        .join("");
}
export function renderLegalPage(input) {
    const nonce = escapeHtml(input.nonce);
    const notice = input.complete
        ? ""
        : `<p class="notice" role="note">Documento en revisión: algunos datos de la empresa están pendientes y se completarán en breve.</p>`;
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(input.title)} · AutoMantPro</title>
<style nonce="${nonce}">${STYLES}</style>
</head>
<body>
<main>
  <a class="brand" href="/">Auto<span>Mant</span>Pro</a>
  <h1>${escapeHtml(input.title)}</h1>
  <p class="meta">Versión ${escapeHtml(LEGAL_VERSION)} · Vigente desde el ${escapeHtml(LEGAL_EFFECTIVE_DATE)}</p>
  ${notice}
  ${renderSections(input.sections)}
  <nav><a href="/">Inicio</a><a href="/terminos">Términos y condiciones</a><a href="/privacidad">Política de privacidad</a></nav>
</main>
</body>
</html>`;
}
export async function legalRoutes(app, options = {}) {
    const load = options.load ?? (async () => emptyLegalData());
    const pages = [
        { path: "/terminos", title: "Términos y condiciones de uso", sections: termsSections },
        { path: "/privacidad", title: "Política de privacidad", sections: privacySections },
    ];
    for (const page of pages) {
        app.get(page.path, async (_request, reply) => {
            let data;
            try {
                data = await load();
            }
            catch {
                data = emptyLegalData();
            }
            const nonce = randomBytes(16).toString("base64");
            return reply
                .header("Content-Security-Policy", `default-src 'none'; style-src 'nonce-${nonce}'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`)
                .header("X-Content-Type-Options", "nosniff")
                .header("Referrer-Policy", "no-referrer")
                .header("X-Frame-Options", "DENY")
                .header("Cache-Control", "no-cache")
                .type("text/html; charset=utf-8")
                .send(renderLegalPage({ title: page.title, sections: page.sections(data), complete: isLegalComplete(data), nonce }));
        });
    }
}
export default legalRoutes;
//# sourceMappingURL=index.js.map