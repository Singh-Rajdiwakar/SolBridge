"use client";

import { motion } from "framer-motion";

export function RadarParticles({
  size,
  reducedMotion = false,
}: {
  size: number;
  reducedMotion?: boolean;
}) {
  const center = size / 2;
  const particles = Array.from({ length: 11 }, (_, index) => {
    const angle = ((index * 31 + 18) * Math.PI) / 180;
    const radius = size * (0.22 + (index % 5) * 0.085);
    return {
      id: `particle-${index}`,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      r: index % 3 === 0 ? 1.45 : 1.05,
      delay: index * 0.16,
    };
  });

  return (
    <g aria-hidden="true">
      {particles.map((particle) => (
        <motion.circle
          key={particle.id}
          cx={particle.x}
          cy={particle.y}
          r={particle.r}
          fill="rgba(167,243,208,0.42)"
          filter="url(#radarParticleGlow)"
          animate={
            reducedMotion
              ? { opacity: 0.16 }
              : {
                  opacity: [0.06, 0.22, 0.06],
                  r: [particle.r * 0.9, particle.r * 1.18, particle.r * 0.9],
                }
          }
          transition={{
            duration: reducedMotion ? 0.2 : 4.8,
            repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </g>
  );
}
