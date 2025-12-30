import { Link } from "react-router-dom";
import logo from "@/assets/aetea-logo-blue-on-black.png";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="AETEA" className="h-6 w-auto" />
          </Link>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#what-aetea-is" className="hover:text-foreground transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#who-its-for" className="hover:text-foreground transition-colors">
              Who it's for
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AETEA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
