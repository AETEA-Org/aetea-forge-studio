/**
 * Prerender the public marketing pages into static HTML, and write the
 * crawler files, after `vite build` and the SSR build of src/entry-server.tsx.
 *
 * Why: AETEA is a client-rendered SPA, so without this every URL serves the
 * same empty <div id="root"> and one generic <head>. Crawlers and AI agents
 * that run no JavaScript would see no copy, no prices and no page metadata.
 *
 * Writes into dist/:
 *   index.html, pricing.html, advisory.html  page HTML with its own <head>
 *   app.html          the plain SPA shell every other route falls back to
 *   robots.txt        allow + sitemap on production, Disallow everywhere else
 *   sitemap.xml       production only
 *   llms.txt          plain-text summary for AI agents, from the same data
 *
 * Indexable only when VERCEL_ENV=production (see vite.config.ts).
 */
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");
const indexable = process.env.VERCEL_ENV === "production";

// The browser-only globals the app touches at import time (the Supabase client
// passes `localStorage` to createClient). Nothing is ever stored. Replaced
// outright rather than defaulted: Node 25 defines its own `localStorage`
// that throws unless started with --localstorage-file.
const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
  clear: () => memory.clear(),
  key: (index) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
};
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });

const ssr = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
const template = await readFile(path.join(dist, "index.html"), "utf8");

const HEAD_BLOCK = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
if (!HEAD_BLOCK.test(template) || !template.includes('<div id="root"></div>')) {
  throw new Error("dist/index.html is missing the seo block or the empty #root");
}

const page = (head, body) =>
  template
    .replace(HEAD_BLOCK, ssr.renderHeadHtml(head, indexable))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

// The fallback shell first, from the untouched template.
await writeFile(path.join(dist, "app.html"), page(ssr.DEFAULT_PAGE, ""));

for (const { path: route, file, head } of ssr.MARKETING_PAGES) {
  const body = ssr.render(route);
  if (body.length < 2000) throw new Error(`Prerender of ${route} is suspiciously short`);
  await writeFile(path.join(dist, file), page(head, body));
  console.log(`prerendered ${route} -> dist/${file} (${body.length} chars)`);
}

const origin = "https://aetea.studio";

await writeFile(
  path.join(dist, "robots.txt"),
  indexable
    ? [
        "# Production. Every crawler, including AI search and answer engines, may read",
        "# the public pages; the signed-in app is not linked and has nothing to index.",
        "User-agent: *",
        "Allow: /",
        "Disallow: /app",
        "",
        `Sitemap: ${origin}/sitemap.xml`,
        "",
      ].join("\n")
    : [
        "# Not production. Crawling stays allowed on purpose: every response here",
        "# carries X-Robots-Tag and a robots meta of noindex, and a crawler blocked",
        "# by robots.txt never sees that, so URLs indexed earlier would never drop out.",
        "User-agent: *",
        "Allow: /",
        "",
      ].join("\n"),
);

if (indexable) {
  const lastmod = new Date().toISOString().slice(0, 10);
  await writeFile(
    path.join(dist, "sitemap.xml"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...ssr.MARKETING_PAGES.map(
        ({ path: route }) => `  <url><loc>${origin}${route}</loc><lastmod>${lastmod}</lastmod></url>`,
      ),
      "</urlset>",
      "",
    ].join("\n"),
  );
} else {
  await rm(path.join(dist, "sitemap.xml"), { force: true });
}

// llms.txt (llmstxt.org): what each public page is, in plain text, with the
// published figures read from the same data the pages render.
const prices = ssr.PRICING_PLANS.map((plan) => {
  const price = plan.oneTime
    ? `${plan.oneTime.price} ${plan.oneTime.priceUnit}`
    : `${plan.monthly.price} ${plan.monthly.priceUnit} or ${plan.annual.price} ${plan.annual.priceUnit}`;
  return `- ${plan.name}: ${price}. ${plan.specs.join(". ")}. ${plan.bestFor}`;
});
const head = Object.fromEntries(ssr.MARKETING_PAGES.map((p) => [p.path, p.head]));
await writeFile(
  path.join(dist, "llms.txt"),
  [
    "# AETEA",
    "",
    `> ${head["/"].description}`,
    "",
    "## Pages",
    "",
    ...ssr.MARKETING_PAGES.map(({ path: route, head: h }) => `- [${h.title}](${origin}${route}): ${h.description}`),
    "",
    "## Pricing (US dollars)",
    "",
    ...prices,
    `- Add-ons: ${ssr.PRICING_ADDONS.map((a) => `${a.name} credits for ${a.price}`).join(", ")}.`,
    "",
    "## Credit rules",
    "",
    ...ssr.CREDIT_RULES.map((rule) => `- ${rule}`),
    "",
    "## Credit costs",
    "",
    ...ssr.CREDIT_ACTIONS.map((row) => `- ${row.action}: ${row.cost}. ${row.meaning}.`),
    "",
    `## ${ssr.ADVISORY_HERO.title}`,
    "",
    ssr.ADVISORY_HERO.distinction,
    "",
    `- Book: ${ssr.ADVISORY_BOOKING_URL}`,
    "",
  ].join("\n"),
);

await rm(ssrDir, { recursive: true, force: true });
console.log(`seo: ${indexable ? "INDEXABLE (production)" : "noindex (not production)"}`);
