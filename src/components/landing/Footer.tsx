import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOTER_BRAND_MARK_CLASS, MARKETING_BRAND_LINKS } from "@/components/landing/marketingBrandLinks";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/aetea-studio/", Icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/aetea.studio", Icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61591948855223", Icon: Facebook },
  {
    label: "X",
    href: "https://x.com/AETEAstudio",
    Icon: ({ className }: { className?: string }) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

function BrandLink({
  link,
  active,
}: {
  link: (typeof MARKETING_BRAND_LINKS)[number];
  active: boolean;
}) {
  return (
    <Link
      to={link.to}
      aria-label={link.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full transition-all hover:scale-105 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active ? "opacity-100" : "opacity-60",
      )}
    >
      <img
        src={link.markSrc}
        alt=""
        aria-hidden="true"
        className={FOOTER_BRAND_MARK_CLASS}
      />
    </Link>
  );
}

function SocialLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {socialLinks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const { pathname } = useLocation();
  const activeLink = MARKETING_BRAND_LINKS.find((link) => link.to === pathname) ?? MARKETING_BRAND_LINKS[0];
  const inactiveLinks = MARKETING_BRAND_LINKS.filter((link) => link.to !== activeLink.to);

  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-5 sm:px-6 lg:px-12">
        <div className="hidden w-full grid-cols-[1fr_auto_1fr] items-center gap-6 md:grid">
          <nav aria-label="Footer navigation" className="flex items-center justify-self-start gap-3">
            {MARKETING_BRAND_LINKS.map((link) => (
              <BrandLink key={link.label} link={link} active={link.to === pathname} />
            ))}
          </nav>

          <div className="justify-self-center">
            <SocialLinks />
          </div>

          <p className="justify-self-end text-sm text-muted-foreground">
            © {new Date().getFullYear()} AETEA
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 md:hidden">
          <nav
            aria-label="Footer navigation"
            className="grid w-[88px] grid-cols-2 place-items-center gap-x-6 gap-y-3"
          >
            <div className="col-span-2">
              <BrandLink link={activeLink} active />
            </div>
            {inactiveLinks.map((link) => (
              <BrandLink key={link.label} link={link} active={false} />
            ))}
          </nav>

          <SocialLinks />

          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} AETEA
          </p>
        </div>
      </div>
    </footer>
  );
}
