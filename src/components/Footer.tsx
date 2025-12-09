import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-rose/10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-peach flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-display font-semibold text-foreground">Warmly</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
              About
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
              Features
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
              Contact
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
              Privacy
            </a>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            Made with love © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
};
