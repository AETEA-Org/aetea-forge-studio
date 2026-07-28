import { Link } from "react-router-dom";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/aetea-studio/" },
  { label: "Instagram", href: "https://www.instagram.com/aetea.studio" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61591948855223" },
  { label: "X", href: "https://x.com/AETEAstudio" },
];

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-6 lg:px-12">
        <div className="flex flex-col items-center gap-6">
          {/* Equal columns keep Pricing/Advisory on the true center axis with socials */}
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

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {socialLinks.map((social, i) => (
              <span key={social.label} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">·</span>}
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {social.label}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
