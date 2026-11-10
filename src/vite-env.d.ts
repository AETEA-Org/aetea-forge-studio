/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" only on the Vercel production build; see vite.config.ts. */
  readonly VITE_SEO_INDEXABLE: "true" | "false";
}
