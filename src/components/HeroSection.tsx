import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-hero opacity-70" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-peach/30 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-lavender/40 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-peach-light border border-rose/20 mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <Heart className="w-4 h-4 text-rose-dark" fill="currentColor" />
          <span className="text-sm font-medium text-foreground">Welcome to your happy place</span>
        </div>
        
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-tight opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
        >
          Where Every Day <br />
          <span className="text-rose-dark">Feels a Little Warmer</span>
        </h1>
        
        <p 
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          A gentle, supportive space designed to bring comfort and joy to your everyday moments. 
          You're welcome here, just as you are.
        </p>
        
        <div 
          className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <Button variant="hero" size="xl">
            Get Started
          </Button>
          <Button variant="soft" size="xl">
            See How It Works
          </Button>
        </div>
        
        <p 
          className="mt-8 text-sm text-muted-foreground opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          No pressure, no rush — take all the time you need 💛
        </p>
      </div>
    </section>
  );
};
