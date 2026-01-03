import { motion } from "framer-motion";
import { Heart, Sparkles, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioFooterProps {
  name: string;
}

export function PortfolioFooter({ name }: PortfolioFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 px-6 border-t border-border/30 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg">{name}</span>
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground flex items-center gap-1"
          >
            © {currentYear} {name}. Made with{" "}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Heart className="w-4 h-4 text-destructive inline fill-destructive" />
            </motion.span>
          </motion.p>

          {/* Powered by & Back to top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <span className="text-xs text-muted-foreground">
              Built with{" "}
              <a
                href="/"
                className="text-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Portfolify
              </a>
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={scrollToTop}
              className="rounded-full w-10 h-10 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
