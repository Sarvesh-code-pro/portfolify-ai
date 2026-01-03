import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AnimatedSection } from "./AnimatedSection";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id?: string;
  name: string;
  role?: string;
  company?: string;
  content?: string;
  text?: string;
  photo_url?: string;
  avatar_url?: string;
  rating?: number;
}

interface PortfolioTestimonialsProps {
  title?: string;
  testimonials: Testimonial[];
}

export function PortfolioTestimonials({ 
  title = "What People Say", 
  testimonials 
}: PortfolioTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (testimonials.length === 0) return null;

  // Normalize testimonial data (support both content/text and photo_url/avatar_url)
  const getTestimonialText = (t: Testimonial) => t.content || t.text || "";
  const getTestimonialImage = (t: Testimonial) => t.photo_url || t.avatar_url;

  return (
    <section id="testimonials" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <span>⭐</span>
            <span>Testimonials</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from people I've had the pleasure of working with
          </p>
        </AnimatedSection>

        {/* Testimonials Carousel */}
        <AnimatedSection delay={0.2}>
          <div className="relative">
            {/* Main Testimonial Card */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="relative p-8 md:p-12 rounded-3xl bg-card/50 border border-border/30 backdrop-blur-sm"
            >
              {/* Large quote icon */}
              <Quote className="absolute top-6 left-6 w-12 h-12 text-primary/20" />
              
              <div className="relative z-10">
                {/* Stars */}
                <div className="flex gap-1 mb-6 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          i < (testimonials[activeIndex].rating || 5)
                            ? "text-warning fill-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-xl md:text-2xl text-center leading-relaxed mb-8 text-foreground/90">
                  "{getTestimonialText(testimonials[activeIndex])}"
                </blockquote>

                {/* Author Info */}
                <div className="flex flex-col items-center gap-4">
                  {getTestimonialImage(testimonials[activeIndex]) ? (
                    <motion.img
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                      src={getTestimonialImage(testimonials[activeIndex])}
                      alt={testimonials[activeIndex].name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl font-bold text-primary-foreground"
                    >
                      {testimonials[activeIndex].name.charAt(0)}
                    </motion.div>
                  )}
                  
                  <div className="text-center">
                    <p className="font-semibold text-lg">{testimonials[activeIndex].name}</p>
                    {(testimonials[activeIndex].role || testimonials[activeIndex].company) && (
                      <p className="text-muted-foreground text-sm">
                        {testimonials[activeIndex].role}
                        {testimonials[activeIndex].role && testimonials[activeIndex].company && " at "}
                        {testimonials[activeIndex].company && (
                          <span className="text-primary">{testimonials[activeIndex].company}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            {testimonials.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevTestimonial}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                {/* Dots */}
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeIndex
                          ? "w-8 bg-primary"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextTestimonial}
                  className="rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Grid view for more testimonials */}
        {testimonials.length > 3 && (
          <AnimatedSection delay={0.3} className="mt-16">
            <h3 className="text-xl font-semibold text-center mb-8">More Reviews</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((testimonial, index) => (
                <motion.div
                  key={testimonial.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {getTestimonialImage(testimonial) ? (
                      <img
                        src={getTestimonialImage(testimonial)}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      {testimonial.company && (
                        <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">"{getTestimonialText(testimonial)}"</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}
