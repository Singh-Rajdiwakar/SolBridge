"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

function range(start: number, end: number, count: number) {
  return Array.from({ length: count }, (_, index) => start + ((end - start) / Math.max(count - 1, 1)) * index);
}

export function CinematicOrb() {
  const reduceMotion = useReducedMotion();
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-9, 9]), {
    stiffness: 110,
    damping: 18,
    mass: 0.6,
  });
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [9, -9]), {
    stiffness: 110,
    damping: 18,
    mass: 0.6,
  });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(x);
    pointerY.set(y);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
      <div className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(242,201,76,0.18),transparent_62%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-[12%] rounded-full border border-[rgba(255,255,255,0.05)]" />
      <motion.div
        ref={surfaceRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={reduceMotion ? undefined : { rotateX, rotateY }}
        className="relative aspect-square w-full max-w-[520px] [perspective:1400px] [transform-style:preserve-3d]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_38%,rgba(255,225,133,0.12),transparent_26%),radial-gradient(circle_at_50%_72%,rgba(34,211,238,0.08),transparent_34%)]" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-70" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id="orb-vignette" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(242,201,76,0.22)" />
              <stop offset="100%" stopColor="rgba(8,9,9,0)" />
            </radialGradient>
            <linearGradient id="mesh-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="50%" stopColor="rgba(242,201,76,0.18)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.08)" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#orb-vignette)" />
          {range(20, 80, 5).map((value) => (
            <g key={value}>
              <circle cx="50" cy="50" r={value / 2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.25" />
              <line x1={value} y1="16" x2={100 - value} y2="84" stroke="url(#mesh-line)" strokeWidth="0.18" />
              <line x1="16" y1={value} x2="84" y2={100 - value} stroke="rgba(255,255,255,0.04)" strokeWidth="0.18" />
            </g>
          ))}
        </svg>

        <motion.div
          className="absolute inset-[14%] rounded-full"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.03, 1],
                  opacity: [0.62, 0.8, 0.62],
                }
          }
          transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,248,214,0.95), rgba(242,201,76,0.86) 22%, rgba(212,167,44,0.94) 48%, rgba(87,63,10,0.96) 82%, rgba(18,16,8,0.98) 100%)",
            boxShadow:
              "0 0 40px rgba(242,201,76,0.32), inset -24px -34px 60px rgba(0,0,0,0.24), inset 18px 22px 38px rgba(255,255,255,0.12)",
          }}
        />

        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{
              width: `${78 + index * 12}%`,
              height: `${32 + index * 9}%`,
              marginLeft: `${-(78 + index * 12) / 2}%`,
              marginTop: `${-(32 + index * 9) / 2}%`,
              borderColor: index === 1 ? "rgba(34,211,238,0.22)" : "rgba(242,201,76,0.55)",
              boxShadow: index === 1 ? "0 0 24px rgba(34,211,238,0.14)" : "0 0 28px rgba(242,201,76,0.16)",
              transformStyle: "preserve-3d",
              rotateX: index === 0 ? "76deg" : index === 1 ? "14deg" : "110deg",
              rotateY: index === 0 ? "12deg" : index === 1 ? "0deg" : "-18deg",
            }}
            animate={reduceMotion ? undefined : { rotateZ: index % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 22 + index * 8, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {[
          { left: "18%", top: "22%", size: 18, delay: 0 },
          { left: "77%", top: "28%", size: 9, delay: 1.2 },
          { left: "24%", top: "71%", size: 12, delay: 2.1 },
          { left: "79%", top: "73%", size: 14, delay: 0.8 },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-[radial-gradient(circle,rgba(255,248,214,0.98),rgba(242,201,76,0.75)_45%,rgba(255,255,255,0)_70%)]"
            style={{ left: item.left, top: item.top, width: item.size, height: item.size, boxShadow: "0 0 20px rgba(242,201,76,0.45)" }}
            animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scale: [0.92, 1.18, 0.92] }}
            transition={{ duration: 4.5, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {[
          { left: "16%", top: "38%", rotate: -18 },
          { left: "74%", top: "16%", rotate: 12 },
          { left: "82%", top: "58%", rotate: 34 },
          { left: "24%", top: "86%", rotate: -28 },
        ].map((item, index) => (
          <motion.div
            key={`fragment-${index}`}
            className="absolute h-8 w-8 rounded-[0.9rem] border border-[rgba(242,201,76,0.28)] bg-[linear-gradient(140deg,rgba(255,255,255,0.1),rgba(242,201,76,0.12),rgba(8,9,9,0.05))] backdrop-blur-md"
            style={{ left: item.left, top: item.top, rotate: `${item.rotate}deg`, boxShadow: "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)" }}
            animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [item.rotate, item.rotate + 9, item.rotate] }}
            transition={{ duration: 6 + index, delay: index * 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <div className="pointer-events-none absolute left-[11%] top-[14%] rounded-full border border-[rgba(242,201,76,0.22)] bg-[rgba(8,9,9,0.48)] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#f3d57c] shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          AI Core Stable
        </div>
        <div className="pointer-events-none absolute bottom-[10%] right-[8%] rounded-full border border-[rgba(34,211,238,0.22)] bg-[rgba(8,9,9,0.52)] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          On-Chain Ready
        </div>
      </motion.div>
    </div>
  );
}
