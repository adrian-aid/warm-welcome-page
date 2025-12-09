import heroImage from "@/assets/hero-image.png";

export const ShowcaseSection = () => {
  return (
    <section className="py-24 px-6 gradient-hero">
      <div className="max-w-5xl mx-auto">
        <div 
          className="relative rounded-3xl overflow-hidden shadow-card opacity-0 animate-scale-in"
          style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
        >
          <img
            src={heroImage}
            alt="Beautiful serene landscape with soft pastel colors"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
        </div>
        
        <div 
          className="text-center mt-10 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <p className="text-xl md:text-2xl font-display italic text-foreground/80">
            "A place where every moment feels a little more special"
          </p>
          <p className="text-muted-foreground mt-3">
            — Designed to bring warmth to your day
          </p>
        </div>
      </div>
    </section>
  );
};
