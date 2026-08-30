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
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/" className="relative z-10">
              <img
                src="/favicon.png"
                alt="AETEA"
                className="h-[30px] w-[30px] rounded-full object-contain transition-opacity hover:opacity-80"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.to;
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors duration-300",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <img
                      src={link.markSrc}
                      alt=""
                      aria-hidden="true"
                      className="h-[30px] w-[30px] rounded-full object-cover"
                    />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              <a
                href={ADVISORY_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Begin an Advisory engagement with Ash Tal."
              >
                Book time
              </a>
            </Button>
            <Link to="/auth" title="Begin working with AETEA.">
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5"
              >
                Start a brief
              </Button>
            </Link>
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
                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
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
                <Link
                  to="/auth"
                  title="Begin working with AETEA."
                  onClick={() => setMobileOpen(false)}
                >
                  <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full">
                    Start a brief
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
