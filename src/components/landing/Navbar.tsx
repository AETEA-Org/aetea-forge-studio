import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Product", href: "#what-aetea-is" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Who it's for", href: "#who-its-for" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          {/* Logo + Nav links - left aligned */}
          <div className="flex items-center gap-10">
            <Link to="/" className="relative z-10">
              <img
                src="/favicon.png"
                alt="AETEA"
                className="h-10 w-10 object-contain transition-opacity hover:opacity-80"
              />
            </Link>
            {/* Desktop Nav - left aligned with favicon */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                Sign in
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                size="sm" 
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5"
              >
                Start a Brief
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass p-6 mt-2 mx-4 rounded-2xl animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border">
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Sign in
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full">
                    Start a Brief
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
