/**
 * Page metadata: one description of a page's <head>, rendered two ways.
 *
 * - `renderHeadHtml()` writes it into the static HTML at build time
 *   (`scripts/prerender.mjs`), which is what search engines and AI crawlers
 *   that run no JavaScript actually read.
 * - `applyHead()` writes the same tags into the live document when the SPA
 *   navigates, so a page reached by a client-side link carries its own title,
 *   canonical and structured data, and leaves none of it behind.
 *
 * Every tag this module owns carries `data-seo`, so it can be found and
 * replaced as a set. Tags without it (charset, viewport, favicon, author) are
 * static and never touched.
 */

/** The production origin. Canonicals and social URLs always point here. */
export const SITE_ORIGIN = "https://aetea.studio";

/**
 * Whether this build may be indexed. True only for the Vercel production
 * deployment (`VERCEL_ENV=production`, set in `vite.config.ts`); dev, PR
 * previews and local builds are all noindex. `vercel.json` adds an
 * `X-Robots-Tag: noindex` header on every host but aetea.studio as a second
 * guard that does not depend on the build.
 */
export const SEO_INDEXABLE = import.meta.env.VITE_SEO_INDEXABLE === "true";

export type HeadSpec = {
  title: string;
  description: string;
  /** Path on SITE_ORIGIN. Present means the page has a canonical URL. */
  path?: string;
  /** Social title and description, when they differ from the page's. */
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  siteName?: string;
  image?: { path: string; width: number; height: number; type: string; alt: string };
  twitterSite?: string;
  /** Schema.org JSON-LD graph. Must describe only what the page shows. */
  jsonLd?: Record<string, unknown>;
};

type Tag = {
  name: "meta" | "link" | "script";
  attrs: Record<string, string>;
  text?: string;
};

export const absoluteUrl = (path: string) => new URL(path, SITE_ORIGIN).toString();

function tagsFor(spec: HeadSpec, indexable: boolean): Tag[] {
  const meta = (key: "name" | "property", id: string, content: string | undefined): Tag[] =>
    content === undefined ? [] : [{ name: "meta", attrs: { [key]: id, content } }];
  const url = spec.path === undefined ? undefined : absoluteUrl(spec.path);
  const image = spec.image;
  const ogTitle = spec.ogTitle ?? spec.title;
  const ogDescription = spec.ogDescription ?? spec.description;

  return [
    ...meta("name", "description", spec.description),
    ...meta(
      "name",
      "robots",
      indexable ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow",
    ),
    ...(url ? [{ name: "link", attrs: { rel: "canonical", href: url } } as Tag] : []),
    ...meta("property", "og:type", spec.ogType ?? "website"),
    ...meta("property", "og:site_name", spec.siteName),
    ...meta("property", "og:title", ogTitle),
    ...meta("property", "og:description", ogDescription),
    ...meta("property", "og:url", url),
    ...meta("property", "og:image", image && absoluteUrl(image.path)),
    ...meta("property", "og:image:type", image?.type),
    ...meta("property", "og:image:width", image && String(image.width)),
    ...meta("property", "og:image:height", image && String(image.height)),
    ...meta("property", "og:image:alt", image?.alt),
    ...meta("name", "twitter:card", "summary_large_image"),
    ...meta("name", "twitter:site", spec.twitterSite),
    ...(image || url
      ? [
          ...meta("name", "twitter:title", ogTitle),
          ...meta("name", "twitter:description", ogDescription),
        ]
      : []),
    ...meta("name", "twitter:image", image && absoluteUrl(image.path)),
    ...meta("name", "twitter:image:alt", image?.alt),
    ...(spec.jsonLd
      ? [
          {
            name: "script",
            attrs: { type: "application/ld+json" },
            // `<` escaped so no string in the data can close the script element.
            text: JSON.stringify(spec.jsonLd).replace(/</g, "\\u003c"),
          } as Tag,
        ]
      : []),
  ];
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The managed part of <head> as HTML, title first. */
export function renderHeadHtml(spec: HeadSpec, indexable = SEO_INDEXABLE): string {
  const lines = [`<title data-seo>${escapeHtml(spec.title)}</title>`];
  for (const tag of tagsFor(spec, indexable)) {
    const attrs = Object.entries(tag.attrs)
      .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
      .join("");
    lines.push(
      tag.name === "script"
        ? `<script data-seo${attrs}>${tag.text ?? ""}</script>`
        : `<${tag.name} data-seo${attrs} />`,
    );
  }
  return lines.join("\n    ");
}

/** Replace every managed tag in the live document with this spec's. */
export function applyHead(spec: HeadSpec, indexable = SEO_INDEXABLE): void {
  const head = document.head;
  head.querySelectorAll("[data-seo]").forEach((element) => {
    if (element.tagName !== "TITLE") element.remove();
  });
  document.title = spec.title;
  document.querySelector("title")?.setAttribute("data-seo", "");
  for (const tag of tagsFor(spec, indexable)) {
    const element = document.createElement(tag.name);
    element.setAttribute("data-seo", "");
    for (const [key, value] of Object.entries(tag.attrs)) element.setAttribute(key, value);
    if (tag.text !== undefined) element.textContent = tag.text;
    head.appendChild(element);
  }
}
