import { Heart, Sparkles, Shield, Smile } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Made with Love",
    description: "Every detail is crafted with care to make your experience delightful and meaningful.",
  },
  {
    icon: Sparkles,
    title: "Feels Like Magic",
    description: "Simple, intuitive, and surprisingly wonderful — it just works beautifully.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Your peace of mind matters. We keep everything protected and private.",
  },
  {
    icon: Smile,
    title: "Always Cheerful",
    description: "Helps you feel calm and organised, bringing a little joy to every day.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
            Why People Love Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Little things that make a big difference in your everyday life
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-3xl gradient-card border border-rose/10 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: "forwards" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-peach-light flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-rose-dark" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
