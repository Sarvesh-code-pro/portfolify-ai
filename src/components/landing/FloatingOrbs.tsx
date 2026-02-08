import { motion } from "framer-motion";

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, hsl(217 91% 60%) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
        }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
      />

      {/* Purple orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, hsl(262 83% 58%) 0%, transparent 70%)",
          top: "50%",
          right: "10%",
        }}
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 40, -50, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
      />

      {/* Cyan orb */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full opacity-[0.02]"
        style={{
          background: "radial-gradient(circle, hsl(185 84% 50%) 0%, transparent 70%)",
          bottom: "20%",
          left: "30%",
        }}
        animate={{
          x: [0, 50, -70, 0],
          y: [0, -30, 60, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      />
    </div>
  );
}
