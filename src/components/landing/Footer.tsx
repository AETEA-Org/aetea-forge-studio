import { Link } from "react-router-dom";
import logo from "@/assets/aetea-logo-white.png";

export function Footer() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <Link to="/">
            <img src={logo} alt="AETEA" className="h-5 w-auto opacity-60 hover:opacity-100 transition-opacity" />
          </Link>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#what-aetea-is" className="hover:text-foreground transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              Process
            </a>
            <a href="#who-its-for" className="hover:text-foreground transition-colors">
              For you
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AETEA
          </p>
        </div>
      </div>
    </footer>
  );
}
