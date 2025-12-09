import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "It's like getting a warm hug every time I open it. Such a thoughtful, beautiful experience.",
    author: "Emma W.",
    role: "Happy user",
  },
  {
    quote: "Finally something that doesn't feel cold and corporate. It genuinely makes me smile.",
    author: "James L.",
    role: "Daily companion",
  },
  {
    quote: "The attention to detail is incredible. You can feel the love that went into making this.",
    author: "Sophie M.",
    role: "Grateful friend",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        <div 
          className="text-center mb-16 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
            Kind Words
          </h2>
          <p className="text-muted-foreground text-lg">
            What our lovely community has to say
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative p-8 rounded-3xl bg-background border border-rose/10 shadow-soft opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.15}s`, animationFillMode: "forwards" }}
            >
              <Quote className="w-10 h-10 text-peach mb-4 opacity-60" />
              <p className="text-foreground text-lg leading-relaxed mb-6 font-display italic">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center">
                  <span className="text-lavender-dark font-semibold text-sm">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
