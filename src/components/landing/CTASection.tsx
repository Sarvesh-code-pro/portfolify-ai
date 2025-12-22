import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="relative max-w-4xl mx-auto text-center p-12 md:p-16 rounded-3xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20" />
          <div className="absolute inset-0 bg-card/80" />
          
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          
          {/* Border gradient */}
          <div className="absolute inset-0 rounded-3xl gradient-border" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Ready to build your portfolio?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've elevated their online presence with Portfolify.
            </p>
            <Button variant="gradient" size="xl" asChild>
              <Link to="/auth?mode=signup" className="group">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
