import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADVISORY_BOOKING_URL } from "@/components/landing/advisory/advisoryData";

const navLinks = [
  { label: "Pricing", to: "/pricing", markSrc: "/pricing/pricing-mark.png" },
  { label: "Advisory", to: "/advisory", markSrc: "/advisory/nav-mark.png" },
] as const;

const desktopControlClass =
  "h-9 rounded-full border border-foreground/60 !bg-transparent px-5 text-xs font-normal tracking-[0.08em] !text-foreground transition-colors hover:border-foreground hover:!bg-foreground hover:!text-background focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function BrandControl({
  label,
  to,
  src,
  active,
}: {
  label: string;
  to: string;
  src: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active ? "opacity-100" : "opacity-85",
      )}
    >
      <img src={src} alt="" aria-hidden="true" className="h-[30px] w-[30px] rounded-full object-cover" />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full border border-foreground/60 bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-4" : "py-6"
      }`}
    >
      <nav className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandControl label="AETEA" to="/" src="/favicon.png" active={pathname === "/"} />

            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.to;
                return <BrandControl key={link.label} label={link.label} to={link.to} src={link.markSrc} active={isActive} />;
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth" title="Begin working with AETEA.">
              <Button
                variant="ghost"
                size="sm"
                className={desktopControlClass}
              >
                Start a brief
              </Button>
            </Link>
            <Button asChild variant="ghost" size="sm" className={desktopControlClass}>
              <a
                href={ADVISORY_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Begin an Advisory engagement with Ash Tal."
              >
                Book time
              </a>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass p-6 mt-2 mx-4 rounded-2xl animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.to;
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 text-sm transition-colors py-2",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <img
                      src={link.markSrc}
                      alt=""
                      aria-hidden="true"
                      className="h-[26px] w-[26px] rounded-full object-cover"
                    />
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border">
                <Link
                  to="/auth"
                  title="Begin working with AETEA."
                  onClick={() => setMobileOpen(false)}
                >
                  <Button variant="ghost" size="sm" className={`w-full ${desktopControlClass}`}>
                    Start a brief
                  </Button>
                </Link>
                <Button asChild variant="ghost" size="sm" className={`w-full ${desktopControlClass}`}>
                  <a
                    href={ADVISORY_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Begin an Advisory engagement with Ash Tal."
                    onClick={() => setMobileOpen(false)}
                  >
                    Book time
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
