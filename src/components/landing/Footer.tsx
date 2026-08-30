import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";

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

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-6 lg:px-12">
        <div className="flex flex-col items-center gap-6">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
            <div className="flex justify-center md:justify-start">
              <Link to="/">
                <img
                  src="/favicon.png"
                  alt="AETEA"
                  className="h-10 w-10 object-contain opacity-60 hover:opacity-100 transition-opacity"
                />
              </Link>
            </div>

            <nav className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/advisory" className="hover:text-foreground transition-colors">
                Advisory
              </Link>
            </nav>

            <p className="text-center text-sm text-muted-foreground md:text-right">
              © {new Date().getFullYear()} AETEA
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
