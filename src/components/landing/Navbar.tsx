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

const hoverLabelClass =
  "pointer-events-none absolute top-full z-20 mt-3 whitespace-nowrap rounded-full border border-foreground/60 bg-transparent px-2.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:hidden";

const compactControlClass =
  "h-11 w-full rounded-full border border-foreground/70 !bg-white/10 px-5 text-xs font-normal tracking-[0.08em] !text-foreground transition-colors hover:border-foreground hover:!bg-white hover:!text-black focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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
      <span className={`${hoverLabelClass} left-1/2 -translate-x-1/2`}>
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
      <nav className="container mx-auto px-5 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandControl label="AETEA" to="/" src="/favicon.png" active={pathname === "/"} />

            <div className="flex items-center gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.to;
                return <BrandControl key={link.label} label={link.label} to={link.to} src={link.markSrc} active={isActive} />;
              })}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link to="/auth" className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className={desktopControlClass}
              >
                Start a brief
              </Button>
              <span className={`${hoverLabelClass} right-0`}>Begin working with AETEA</span>
            </Link>
            <div className="group relative">
              <Button asChild variant="ghost" size="sm" className={desktopControlClass}>
                <a
                  href={ADVISORY_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book time
                </a>
              </Button>
              <span className={`${hoverLabelClass} right-0`}>Begin an Advisory engagement with Ash Tal</span>
            </div>
          </div>

          <button
            className="p-2 text-foreground lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full mx-4 mt-2 overflow-visible rounded-2xl border border-foreground/15 bg-black/90 px-4 pb-12 pt-5 shadow-2xl backdrop-blur-xl animate-fade-in sm:px-5 lg:hidden">
            <div className="flex flex-col gap-8">
              <Link
                to="/auth"
                className="group relative"
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="ghost" size="sm" className={compactControlClass}>
                  Start a brief
                </Button>
                <span className={`${hoverLabelClass} right-0`}>Begin working with AETEA</span>
              </Link>
              <div className="group relative">
                <Button asChild variant="ghost" size="sm" className={compactControlClass}>
                  <a
                    href={ADVISORY_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book time
                  </a>
                </Button>
                <span className={`${hoverLabelClass} right-0`}>Begin an Advisory engagement with Ash Tal</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
