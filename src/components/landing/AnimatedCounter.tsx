import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, Briefcase, Star, Globe } from "lucide-react";

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(count, value, { duration: 2, ease: "easeOut" });
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [count, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { icon: Users, label: "Professionals", value: 12000, suffix: "+", color: "from-primary to-[hsl(262_83%_58%)]" },
  { icon: Briefcase, label: "Portfolios Created", value: 8500, suffix: "+", color: "from-[hsl(185_84%_50%)] to-primary" },
  { icon: Star, label: "Average Rating", value: 49, suffix: "/5", displayValue: "4.9", color: "from-[hsl(45_93%_55%)] to-[hsl(32_95%_55%)]" },
  { icon: Globe, label: "Countries", value: 120, suffix: "+", color: "from-success to-[hsl(185_84%_50%)]" },
];

export function AnimatedCounter() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="font-display text-4xl md:text-5xl font-bold mb-2">
                {stat.displayValue ? (
                  <span>{stat.displayValue}</span>
                ) : (
                  <Counter value={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
