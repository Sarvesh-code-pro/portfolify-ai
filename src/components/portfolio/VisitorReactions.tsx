import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ThumbsUp, Star, Rocket, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface VisitorReactionsProps {
  portfolioId: string;
}

const reactions = [
  { emoji: "👏", label: "Impressive", icon: ThumbsUp },
  { emoji: "❤️", label: "Love it", icon: Heart },
  { emoji: "⭐", label: "Amazing", icon: Star },
  { emoji: "🚀", label: "Inspiring", icon: Rocket },
  { emoji: "☕", label: "Let's connect", icon: Coffee },
];

export function VisitorReactions({ portfolioId }: VisitorReactionsProps) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  // Get local storage key for this portfolio
  const storageKey = `portfolio-reaction-${portfolioId}`;

  useEffect(() => {
    // Check if user already reacted
    const savedReaction = localStorage.getItem(storageKey);
    if (savedReaction) {
      setSelectedReaction(savedReaction);
    }

    // Fetch reaction counts from analytics (simplified - using link clicks as proxy)
    fetchReactionCounts();
  }, [portfolioId]);

  const fetchReactionCounts = async () => {
    try {
      const { data } = await supabase
        .from("portfolio_link_clicks")
        .select("link_type, click_count")
        .eq("portfolio_id", portfolioId)
        .like("link_type", "reaction_%");

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((item) => {
          const emoji = item.link_type.replace("reaction_", "");
          counts[emoji] = item.click_count;
        });
        setReactionCounts(counts);
      }
    } catch (e) {
      console.error("Failed to fetch reactions:", e);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (selectedReaction === emoji) return;

    setIsAnimating(true);
    setSelectedReaction(emoji);
    localStorage.setItem(storageKey, emoji);

    // Update counts optimistically
    setReactionCounts((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
      ...(selectedReaction ? { [selectedReaction]: Math.max(0, (prev[selectedReaction] || 1) - 1) } : {}),
    }));

    // Track reaction as a special link click
    try {
      await supabase.functions.invoke("track-analytics", {
        body: {
          portfolioId,
          action: "link_click",
          linkType: `reaction_${emoji}`,
          linkUrl: emoji,
        },
      });
    } catch (e) {
      console.error("Failed to track reaction:", e);
    }

    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="py-8 text-center"
    >
      <p className="text-muted-foreground text-sm mb-4">What do you think of this portfolio?</p>
      
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {reactions.map((reaction) => {
          const isSelected = selectedReaction === reaction.emoji;
          const count = reactionCounts[reaction.emoji] || 0;

          return (
            <motion.div key={reaction.emoji} className="relative">
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleReaction(reaction.emoji)}
                className={`gap-2 transition-all ${
                  isSelected
                    ? "bg-primary/20 border-primary text-primary hover:bg-primary/30"
                    : "hover:border-primary/50"
                }`}
              >
                <span className="text-lg">{reaction.emoji}</span>
                <span className="text-xs hidden sm:inline">{reaction.label}</span>
                {count > 0 && (
                  <span className="text-xs font-medium opacity-60">{count}</span>
                )}
              </Button>

              {/* Floating animation on click */}
              {isSelected && isAnimating && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 1, y: 0, x: 0 }}
                      animate={{
                        opacity: 0,
                        y: -40 - Math.random() * 20,
                        x: (Math.random() - 0.5) * 40,
                      }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="absolute top-0 left-1/2 text-lg pointer-events-none"
                    >
                      {reaction.emoji}
                    </motion.span>
                  ))}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {selectedReaction && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground mt-3"
        >
          Thanks for your feedback! 💫
        </motion.p>
      )}
    </motion.div>
  );
}
