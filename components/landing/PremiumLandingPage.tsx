"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, BrainCircuit, CandlestickChart, Landmark, ShieldCheck, Sparkles, Vote, Wallet } from "lucide-react";

import { CinematicOrb } from "@/components/landing/CinematicOrb";
import { cn } from "@/utils/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const featureCards = [
  ["Wallet Intelligence", "Unified on-chain control with premium portfolio telemetry", Wallet],
  ["AI Financial Assistant", "Explainable guidance across yield, allocation, and risk", Sparkles],
  ["Risk Engine", "Volatility, borrow, LP, and concentration monitoring", ShieldCheck],
  ["Markets + Trading", "Live market context with terminal-grade data surfaces", CandlestickChart],
] as const;

const modules = [
  "Wallet",
  "Staking",
  "Liquidity",
  "Lending",
  "Governance",
  "Analytics",
  "Security",
  "Assistant",
];

const infraHighlights = [
  { icon: Activity, label: "Network monitor", value: "1,984 TPS" },
  { icon: Vote, label: "Governance", value: "12 active signals" },
  { icon: Landmark, label: "Treasury", value: "$2.4M managed" },
  { icon: ShieldCheck, label: "Security", value: "Risk monitored" },
] as const;

function Section({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return <section id={id} className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 xl:px-16">{children}</section>;
}

export function PremiumLandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080909] text-[#f5f5f5]">
      <div className="lux-landing-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_18%_18%,rgba(242,201,76,0.16),transparent_22%),radial-gradient(circle_at_82%_8%,rgba(34,211,238,0.12),transparent_18%),radial-gradient(circle_at_50%_0%,rgba(255,215,111,0.08),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[32rem] bg-[radial-gradient(circle_at_left,rgba(212,167,44,0.08),transparent_62%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[28rem] bg-[radial-gradient(circle_at_right,rgba(59,130,246,0.08),transparent_62%)] blur-3xl" />

      <main className="relative z-10">
        <Section>
          <motion.header initial="hidden" animate="visible" variants={fadeUp} custom={0} className="lux-panel flex flex-col gap-6 px-5 py-5 md:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(242,201,76,0.18)] bg-[linear-gradient(145deg,rgba(242,201,76,0.18),rgba(16,17,18,0.9))] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <span className="font-mono text-lg font-semibold tracking-[0.2em] text-[#f2c94c]">RW</span>
              </div>
              <div>
                <div className="text-xl font-semibold tracking-tight text-white">Retix Wallet</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.32em] text-[#8f9094]">AI Financial Ecosystem</div>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-3 text-sm text-[#b8b8b8]">
              {["ecosystem", "modules", "analytics", "infrastructure"].map((item) => (
                <a key={item} href={`#${item}`} className="rounded-full border border-white/8 px-4 py-2 transition hover:border-[rgba(242,201,76,0.28)] hover:text-white">
                  {item[0].toUpperCase() + item.slice(1)}
                </a>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(242,201,76,0.18)] bg-[rgba(242,201,76,0.08)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#f3d57c]">
                <span className="h-2 w-2 rounded-full bg-[#f2c94c] shadow-[0_0_18px_rgba(242,201,76,0.8)]" />
                Devnet Live
              </div>
              <Link href="/login" className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-[rgba(242,201,76,0.28)] hover:bg-white/[0.03]">Login</Link>
              <Link href="/dashboard/wallet" className="group relative overflow-hidden rounded-full border border-[rgba(242,201,76,0.28)] bg-[linear-gradient(135deg,#d4a72c,#f2c94c)] px-5 py-3 text-sm font-semibold text-[#080909] shadow-[0_18px_60px_rgba(212,167,44,0.24)] transition hover:-translate-y-0.5">
                <span className="absolute inset-0 lux-button-sweep opacity-80" />
                <span className="relative inline-flex items-center gap-2">Launch App<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
              </Link>
            </div>
          </motion.header>

          <div className="grid gap-12 pt-14 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="mb-6 flex flex-wrap gap-3">
                {["AI Assistant", "Treasury-Ready", "On-Chain Execution"].map((chip, index) => (
                  <div key={chip} className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.26em] shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl", index === 1 ? "border-[rgba(34,211,238,0.18)] bg-[rgba(34,211,238,0.07)] text-cyan-200" : "border-[rgba(242,201,76,0.18)] bg-[rgba(242,201,76,0.07)] text-[#f3d57c]")}>
                    <span className={cn("h-2 w-2 rounded-full", index === 1 ? "bg-cyan-300" : "bg-[#f2c94c]")} />
                    {chip}
                  </div>
                ))}
              </div>
              <div className="mb-5 text-[11px] uppercase tracking-[0.35em] text-[#8f9094]">Premium Web3 Infrastructure</div>
              <h1 className="max-w-[10ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-7xl xl:text-[5.75rem]">
                Cinematic intelligence for the next era of on-chain finance.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#b8b8b8] md:text-xl">
                Retix Wallet unifies wallet operations, AI guidance, DeFi analytics, governance, treasury, and infrastructure visibility into one luxury-grade crypto control surface.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/dashboard/wallet" className="group relative overflow-hidden rounded-2xl border border-[rgba(242,201,76,0.28)] bg-[linear-gradient(135deg,#d4a72c,#f2c94c)] px-6 py-4 text-sm font-semibold text-[#080909] shadow-[0_22px_80px_rgba(212,167,44,0.28)] transition hover:-translate-y-0.5">
                  <span className="absolute inset-0 lux-button-sweep opacity-80" />
                  <span className="relative inline-flex items-center gap-2">Enter Wallet Intelligence<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                </Link>
                <Link href="/dashboard/analytics" className="rounded-2xl border border-[rgba(242,201,76,0.18)] bg-white/[0.02] px-6 py-4 text-sm font-medium text-white transition hover:border-[rgba(242,201,76,0.32)] hover:bg-white/[0.04]">
                  Explore Analytics
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                {["Solana", "Anchor", "AI Advisory", "DeFi Analytics", "Treasury Ops", "Network Monitor"].map((chip) => (
                  <div key={chip} className="rounded-full border border-white/8 bg-white/[0.02] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#b8b8b8] backdrop-blur-xl">
                    {chip}
                  </div>
                ))}
              </div>
              <div className="mt-12 grid gap-4 md:grid-cols-3">
                {[
                  { label: "Visible capital", value: "$68.8K", detail: "cross-module analytics in sync" },
                  { label: "Risk engine", value: "28/100", detail: "portfolio resilience improving" },
                  { label: "Assistant relevance", value: "87%", detail: "based on live protocol signals" },
                ].map((item, index) => (
                  <motion.div key={item.label} animate={reduceMotion ? undefined : { y: [0, -6, 0] }} transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }} className="lux-panel relative overflow-hidden p-5">
                    <div className="absolute inset-0 lux-card-sweep opacity-60" />
                    <div className="relative text-[11px] uppercase tracking-[0.2em] text-[#8f9094]">{item.label}</div>
                    <div className="relative mt-3 text-3xl font-semibold text-white">{item.value}</div>
                    <div className="relative mt-2 text-sm text-[#b8b8b8]">{item.detail}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.14} className="relative">
              <div className="absolute left-[8%] top-[16%] lux-floating-chip"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.85)]" />Network stable</div>
              <div className="absolute right-[4%] top-[42%] lux-floating-chip lux-floating-chip--gold"><span className="h-2 w-2 rounded-full bg-[#f2c94c] shadow-[0_0_16px_rgba(242,201,76,0.85)]" />Yield live</div>
              <CinematicOrb />
            </motion.div>
          </div>
        </Section>

        <Section id="ecosystem">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f9094]">Feature Grid</div>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Financial depth, protocol-grade tooling, and cinematic Web3 presentation in one ecosystem.</h2>
          </motion.div>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(([label, title, Icon], index) => (
              <motion.div key={title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={0.08 + index * 0.06} whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }} className="lux-panel group relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,201,76,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.06),transparent_34%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="relative w-fit rounded-2xl border border-[rgba(242,201,76,0.16)] bg-[rgba(242,201,76,0.06)] p-3 text-[#f3d57c]"><Icon className="h-5 w-5" /></div>
                <div className="relative mt-6 text-[11px] uppercase tracking-[0.22em] text-[#8f9094]">{label}</div>
                <h3 className="relative mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
                <p className="relative mt-4 text-sm leading-7 text-[#b8b8b8]">Designed to feel product-grade, cinematic, and technically credible from the first impression.</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section id="modules">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="lux-panel overflow-hidden p-7">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-[#8f9094]"><BrainCircuit className="h-4 w-4 text-[#f2c94c]" />Product Modules</div>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">One platform spanning wallet, markets, strategy, governance, social, and treasury intelligence.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#b8b8b8]">The product is structured as a serious on-chain financial operating system, not a single-purpose wallet UI. Each module connects into the same risk, analytics, and assistant layers.</p>
              <div className="mt-10 h-[360px] overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(160deg,rgba(242,201,76,0.08),rgba(11,12,14,0.6))] p-6">
                <div className="lux-mesh-panel relative h-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[rgba(8,9,9,0.88)] p-5">
                  <div className="absolute inset-0 lux-mesh-overlay opacity-60" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between"><div><div className="text-[11px] uppercase tracking-[0.28em] text-[#8f9094]">Ecosystem Preview</div><div className="mt-2 text-2xl font-semibold text-white">AI + DeFi command surface</div></div><div className="rounded-full border border-[rgba(242,201,76,0.18)] bg-[rgba(242,201,76,0.08)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#f3d57c]">Multi-module</div></div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-[#8f9094]">Portfolio Value</div><div className="mt-3 text-3xl font-semibold text-white">$68.8K</div><div className="mt-2 text-sm text-emerald-300">+11.7% on-chain growth</div></div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-[11px] uppercase tracking-[0.18em] text-[#8f9094]">Assistant Signal</div><div className="mt-3 text-3xl font-semibold text-white">87%</div><div className="mt-2 text-sm text-cyan-200">idle SOL can move to staking</div></div>
                    </div>
                    <svg className="relative h-36 w-full" viewBox="0 0 640 160" aria-hidden="true"><defs><linearGradient id="dash-gold" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stopColor="#f2c94c" stopOpacity="0.1" /><stop offset="45%" stopColor="#f2c94c" stopOpacity="0.9" /><stop offset="100%" stopColor="#22d3ee" stopOpacity="0.28" /></linearGradient></defs><path d="M0 118 C68 110, 102 74, 168 82 S292 138, 352 102 462 34, 534 72 606 122, 640 86" fill="none" stroke="url(#dash-gold)" strokeWidth="4" strokeLinecap="round" /></svg>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="grid gap-5 md:grid-cols-2">
              {modules.map((item, index) => (
                <motion.div key={item} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={0.08 + index * 0.05} whileHover={reduceMotion ? undefined : { y: -5 }} className="lux-panel p-5">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#8f9094]">{item}</div>
                  <div className="mt-4 text-xl font-semibold text-white">{item} Surface</div>
                  <p className="mt-3 text-sm leading-7 text-[#b8b8b8]">Production-grade module designed to plug into the same premium analytics and execution language.</p>
                  <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-xs uppercase tracking-[0.18em]"><span className={index % 2 === 0 ? "text-[#f3d57c]" : "text-cyan-200"}>Live module</span><span className="text-[#7b7b7b]">production-grade</span></div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="analytics">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="lux-panel p-7">
              <div className="flex items-center justify-between gap-4"><div><div className="text-[11px] uppercase tracking-[0.3em] text-[#8f9094]">Dashboard Preview</div><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">A cinematic financial console, not a generic admin shell.</h2></div><div className="rounded-full border border-[rgba(34,211,238,0.18)] bg-[rgba(34,211,238,0.08)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200">AI + Markets</div></div>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#b8b8b8]">Premium chart styling, protocol-aware analytics, treasury visibility, strategy planning, tax reporting, social wallet discovery, and real-time network monitoring live inside the same product language.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.6rem] border border-[rgba(242,201,76,0.16)] bg-[linear-gradient(180deg,rgba(20,21,22,0.94),rgba(10,12,14,0.96))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
                  <div className="flex items-center justify-between"><div><div className="text-[11px] uppercase tracking-[0.2em] text-[#8f9094]">Wallet Analytics</div><div className="mt-2 text-2xl font-semibold text-white">$61.2K</div></div><div className="rounded-full border border-[rgba(242,201,76,0.18)] bg-[rgba(242,201,76,0.08)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#f3d57c]">+18.4%</div></div>
                  <svg className="mt-8 h-48 w-full" viewBox="0 0 420 180" aria-hidden="true"><defs><linearGradient id="hero-chart" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f2c94c" stopOpacity="0.2" /><stop offset="55%" stopColor="#f2c94c" stopOpacity="0.95" /><stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" /></linearGradient></defs><path d="M0 142 C38 136, 64 118, 92 108 S148 84, 182 94 236 154, 288 122 344 68, 384 78 408 98, 420 42" fill="none" stroke="url(#hero-chart)" strokeWidth="4" strokeLinecap="round" /><path d="M0 142 C38 136, 64 118, 92 108 S148 84, 182 94 236 154, 288 122 344 68, 384 78 408 98, 420 42 L420 180 L0 180 Z" fill="url(#hero-chart)" opacity="0.16" /></svg>
                </div>
                <div className="grid gap-4">
                  {["Treasury health", "Network monitor", "Strategy engine"].map((label, index) => (
                    <div key={label} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[#8f9094]">{label}</div>
                      <div className="mt-3 text-2xl font-semibold text-white">{index === 0 ? "Healthy" : index === 1 ? "98/100" : "Balanced"}</div>
                      <div className="mt-2 text-sm text-[#b8b8b8]">{index === 0 ? "stable reserves strengthening" : index === 1 ? "RPC latency nominal" : "yield vs risk optimized"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="lux-panel p-7">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f9094]">AI + Blockchain Intelligence</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Explainable financial guidance layered over real protocol data.</h2>
              <div className="mt-8 grid gap-4">
                {[
                  { title: "Top opportunity", detail: "Shift idle SOL into staking while preserving reserve coverage.", tone: "gold" },
                  { title: "Main risk", detail: "High concentration in one volatile asset keeps drawdown sensitivity elevated.", tone: "cyan" },
                  { title: "Protocol impact", detail: "Fast network conditions make transaction-heavy flows cheaper and smoother.", tone: "gold" },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("rounded-2xl border p-3", item.tone === "gold" ? "border-[rgba(242,201,76,0.18)] bg-[rgba(242,201,76,0.08)] text-[#f3d57c]" : "border-[rgba(34,211,238,0.18)] bg-[rgba(34,211,238,0.08)] text-cyan-200")}><Sparkles className="h-5 w-5" /></div>
                      <div><div className="text-lg font-semibold text-white">{item.title}</div><div className="mt-2 text-sm leading-7 text-[#b8b8b8]">{item.detail}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </Section>

        <Section id="infrastructure">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="lux-panel p-7">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f9094]">Network / Ecosystem</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">Operations visibility from wallet execution to protocol health.</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {infraHighlights.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between"><div className="text-[11px] uppercase tracking-[0.2em] text-[#8f9094]">{label}</div><Icon className="h-4 w-4 text-[#f2c94c]" /></div>
                    <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
                    <div className="mt-2 text-sm text-[#b8b8b8]">Visible infrastructure intelligence</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} className="lux-panel p-7">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f9094]">Blockchain Mesh</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">A network-aware product surface with visible structure and depth.</h2>
              <div className="mt-8 h-[320px] rounded-[1.8rem] border border-white/10 bg-[rgba(10,11,12,0.88)] p-4">
                <svg className="h-full w-full" viewBox="0 0 620 320" aria-hidden="true">
                  <defs><radialGradient id="mesh-node" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#f2c94c" stopOpacity="1" /><stop offset="100%" stopColor="#f2c94c" stopOpacity="0" /></radialGradient><linearGradient id="mesh-edge" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stopColor="rgba(242,201,76,0.18)" /><stop offset="100%" stopColor="rgba(34,211,238,0.12)" /></linearGradient></defs>
                  {[[90,80],[210,48],[330,112],[468,72],[550,146],[154,206],[276,236],[432,228],[544,262],[86,258]].map(([x,y], index, array) => <g key={`${x}-${y}`}>{array.slice(index + 1, index + 4).map(([tx,ty]) => <line key={`${x}-${y}-${tx}-${ty}`} x1={x} y1={y} x2={tx} y2={ty} stroke="url(#mesh-edge)" strokeWidth="1" />)}<circle cx={x} cy={y} r="18" fill="url(#mesh-node)" /><circle cx={x} cy={y} r="4.5" fill={index % 3 === 0 ? "#22d3ee" : "#f2c94c"} /></g>)}
                </svg>
              </div>
            </motion.div>
          </div>
        </Section>

        <Section>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="lux-panel relative overflow-hidden p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(242,201,76,0.16),transparent_18%),radial-gradient(circle_at_85%_50%,rgba(34,211,238,0.12),transparent_24%)]" />
            <div className="absolute inset-0 lux-card-sweep opacity-80" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] uppercase tracking-[0.3em] text-[#8f9094]">Launch the ecosystem</div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">Enter a luxury-grade Solana product surface built for analytics, execution, and financial intelligence.</h2>
                <p className="mt-5 text-base leading-8 text-[#b8b8b8]">Built to feel unforgettable on first load and credible in front of recruiters, users, and technical reviewers.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="group relative overflow-hidden rounded-2xl border border-[rgba(242,201,76,0.28)] bg-[linear-gradient(135deg,#d4a72c,#f2c94c)] px-6 py-4 text-sm font-semibold text-[#080909] shadow-[0_22px_80px_rgba(212,167,44,0.28)] transition hover:-translate-y-0.5">
                  <span className="absolute inset-0 lux-button-sweep opacity-80" />
                  <span className="relative inline-flex items-center gap-2">Create Account<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                </Link>
                <Link href="/dashboard/network" className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium text-white transition hover:border-[rgba(242,201,76,0.28)] hover:bg-white/[0.05]">View Network Monitor</Link>
              </div>
            </div>
          </motion.div>
        </Section>
      </main>
    </div>
  );
}
