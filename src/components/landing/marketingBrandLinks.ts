export const MARKETING_BRAND_LINKS = [
  { label: "AETEA", to: "/", markSrc: "/favicon.png" },
  { label: "Pricing", to: "/pricing", markSrc: "/pricing/pricing-mark.png" },
  { label: "Advisory", to: "/advisory", markSrc: "/advisory/nav-mark.png" },
] as const;

export const FOOTER_BRAND_MARK_CLASS = "h-[30px] w-[30px] rounded-full object-cover";

/** AETEA's own social profiles: the footer links and the Organization `sameAs`. */
export const AETEA_SOCIAL = {
  LinkedIn: "https://www.linkedin.com/company/aetea-studio/",
  Instagram: "https://www.instagram.com/aetea.studio",
  Facebook: "https://www.facebook.com/profile.php?id=61591948855223",
  X: "https://x.com/AETEAstudio",
} as const;

export const AETEA_SOCIAL_URLS = Object.values(AETEA_SOCIAL);
