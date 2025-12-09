import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div 
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-peach-light mb-8 animate-float">
            <Heart className="w-8 h-8 text-rose-dark" fill="currentColor" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-display font-semibold text-foreground mb-6">
            Ready when you are
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Take your time. We'll be here whenever you're ready to start your journey with us.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Get Started Today
            </Button>
            <Button variant="outline" size="xl">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
