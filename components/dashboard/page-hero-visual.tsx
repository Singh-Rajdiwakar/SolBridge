import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { cn } from "@/utils/cn";

export type PageHeroVariant =
  | "dashboard"
  | "admin"
  | "wallet"
  | "markets"
  | "trading"
  | "transfer"
  | "stake"
  | "pools"
  | "borrow"
  | "governance"
  | "treasury"
  | "tokens"
  | "nfts"
  | "swap"
  | "analytics"
  | "assistant"
  | "strategy"
  | "tax"
  | "risk"
  | "social"
  | "security"
  | "network"
  | "explorer"
  | "devtools"
  | "portfolio"
  | "settings"
  | "generic";

const DynamicPageHeroScene = dynamic(
  () => import("./page-hero-scene").then((module) => module.PageHeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 overflow-hidden rounded-[1.8rem] bg-[radial-gradient(circle_at_50%_45%,rgba(242,201,76,0.16),transparent_32%),linear-gradient(180deg,rgba(21,24,27,0.18),transparent)]">
        <div className="hero-glow-pulse absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fff2cb_0%,#f2c94c_34%,rgba(18,14,8,0.96)_100%)] shadow-[0_0_42px_rgba(242,201,76,0.2)]" />
        <div className="hero-orbit absolute left-1/2 top-1/2 h-44 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(242,201,76,0.24)]" />
      </div>
    ),
  },
);

type HeroVisualConfig = {
  title: string;
  tag: string;
  className: string;
  chipTone?: "gold" | "cyan" | "rose";
  supportA?: string;
  supportB?: string;
};

const VISUALS: Record<PageHeroVariant, HeroVisualConfig> = {
  dashboard: {
    title: "Executive command core",
    tag: "Protocol synced",
    className:
      "bg-[radial-gradient(circle_at_20%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Capital live",
    supportB: "Signals active",
  },
  admin: {
    title: "Protocol control room",
    tag: "Privileged access",
    className:
      "bg-[radial-gradient(circle_at_28%_16%,rgba(242,201,76,0.16),transparent_24%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Admin scope",
    supportB: "State ready",
  },
  wallet: {
    title: "Secure wallet vault",
    tag: "Protected",
    className:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Vault live",
    supportB: "Execution secured",
  },
  markets: {
    title: "Market pulse cluster",
    tag: "Live pricing",
    className:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(242,201,76,0.14),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.1),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Price live",
    supportB: "Flow depth",
  },
  trading: {
    title: "Execution prism",
    tag: "High tempo",
    className:
      "bg-[radial-gradient(circle_at_28%_14%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(34,211,238,0.12),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Signal loaded",
    supportB: "Latency tight",
  },
  transfer: {
    title: "Transaction route",
    tag: "Precise flow",
    className:
      "bg-[radial-gradient(circle_at_20%_18%,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_78%_20%,rgba(242,201,76,0.14),transparent_24%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Path visualized",
    supportB: "Fee aware",
  },
  stake: {
    title: "Yield chamber",
    tag: "Rewards rising",
    className:
      "bg-[radial-gradient(circle_at_50%_16%,rgba(242,201,76,0.18),transparent_24%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "APY live",
    supportB: "Rewards compounding",
  },
  pools: {
    title: "Dual reserve flow",
    tag: "Fluid reserves",
    className:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_78%_76%,rgba(242,201,76,0.16),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Reserve drift",
    supportB: "LP depth",
  },
  borrow: {
    title: "Collateral balance",
    tag: "Controlled tension",
    className:
      "bg-[radial-gradient(circle_at_72%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_18%_70%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Health tracked",
    supportB: "Debt pressure",
  },
  governance: {
    title: "Decision chamber",
    tag: "Measured consensus",
    className:
      "bg-[radial-gradient(circle_at_50%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_82%_24%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Vote synced",
    supportB: "Quorum live",
  },
  treasury: {
    title: "Reserve vault",
    tag: "Capital protected",
    className:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(242,201,76,0.18),transparent_24%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Runway tracked",
    supportB: "Reserves audited",
  },
  tokens: {
    title: "Mint forge",
    tag: "Supply precision",
    className:
      "bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.08),transparent_18%),radial-gradient(circle_at_22%_18%,rgba(242,201,76,0.16),transparent_24%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Authority mapped",
    supportB: "Supply visible",
  },
  nfts: {
    title: "Holographic gallery",
    tag: "Collectible focus",
    className:
      "bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.12),transparent_18%),radial-gradient(circle_at_18%_74%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Gallery premium",
    supportB: "Rarity aware",
  },
  swap: {
    title: "Exchange loop",
    tag: "Conversion live",
    className:
      "bg-[radial-gradient(circle_at_20%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_78%_76%,rgba(34,211,238,0.1),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Route optimized",
    supportB: "Execution ready",
  },
  analytics: {
    title: "Data intelligence core",
    tag: "Insight engine",
    className:
      "bg-[radial-gradient(circle_at_24%_18%,rgba(242,201,76,0.14),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(34,211,238,0.12),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Signals decoded",
    supportB: "PnL live",
  },
  assistant: {
    title: "Neural finance core",
    tag: "Explainable",
    className:
      "bg-[radial-gradient(circle_at_76%_18%,rgba(34,211,238,0.14),transparent_18%),radial-gradient(circle_at_22%_70%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Why it matters",
    supportB: "Action linked",
  },
  strategy: {
    title: "Allocation matrix",
    tag: "Structured planning",
    className:
      "bg-[radial-gradient(circle_at_22%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Yield modeled",
    supportB: "Stress tested",
  },
  tax: {
    title: "Report ledger",
    tag: "Export ready",
    className:
      "bg-[radial-gradient(circle_at_22%_16%,rgba(242,201,76,0.16),transparent_24%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Year selected",
    supportB: "Events classified",
  },
  risk: {
    title: "Volatility field",
    tag: "Stress aware",
    className:
      "bg-[radial-gradient(circle_at_76%_18%,rgba(251,113,133,0.12),transparent_18%),radial-gradient(circle_at_24%_18%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "rose",
    supportA: "Risk rising",
    supportB: "Threshold aware",
  },
  social: {
    title: "Wallet network cloud",
    tag: "Connected profiles",
    className:
      "bg-[radial-gradient(circle_at_26%_18%,rgba(34,211,238,0.12),transparent_18%),radial-gradient(circle_at_82%_20%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Profiles linked",
    supportB: "Signals spreading",
  },
  security: {
    title: "Protection shield",
    tag: "Defense active",
    className:
      "bg-[radial-gradient(circle_at_74%_18%,rgba(34,211,238,0.1),transparent_18%),radial-gradient(circle_at_20%_72%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "rose",
    supportA: "Scan active",
    supportB: "Defense stable",
  },
  network: {
    title: "Validator mesh globe",
    tag: "Infra live",
    className:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(34,211,238,0.14),transparent_18%),radial-gradient(circle_at_84%_18%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "TPS flowing",
    supportB: "Latency nominal",
  },
  explorer: {
    title: "Trace lattice",
    tag: "Search active",
    className:
      "bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.12),transparent_18%),radial-gradient(circle_at_22%_18%,rgba(242,201,76,0.12),transparent_22%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    chipTone: "cyan",
    supportA: "Path decoded",
    supportB: "On-chain verified",
  },
  devtools: {
    title: "Execution lattice",
    tag: "IDL loaded",
    className:
      "bg-[radial-gradient(circle_at_22%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Simulation ready",
    supportB: "Program logs",
  },
  portfolio: {
    title: "Wealth orbit system",
    tag: "Allocation live",
    className:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(242,201,76,0.16),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Value tracked",
    supportB: "Yield visible",
  },
  settings: {
    title: "System controls",
    tag: "Workspace tuned",
    className:
      "bg-[radial-gradient(circle_at_74%_18%,rgba(242,201,76,0.12),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Preferences saved",
    supportB: "Profile ready",
  },
  generic: {
    title: "Cinematic module",
    tag: "Premium live",
    className:
      "bg-[radial-gradient(circle_at_24%_16%,rgba(242,201,76,0.14),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(18,20,22,0.96),rgba(8,9,10,0.96))]",
    supportA: "Premium shell",
    supportB: "Live surface",
  },
};

function Frame({
  title,
  tag,
  className,
  chipTone = "gold",
  supportA,
  supportB,
  children,
}: {
  title: string;
  tag: string;
  className?: string;
  chipTone?: "gold" | "cyan" | "rose";
  supportA?: string;
  supportB?: string;
  children: ReactNode;
}) {
  const chipClasses =
    chipTone === "cyan"
      ? "border-cyan-300/22 bg-cyan-300/10 text-cyan-100"
      : chipTone === "rose"
        ? "border-rose-300/24 bg-rose-400/10 text-rose-100"
        : "border-[rgba(224,185,75,0.22)] bg-[rgba(224,185,75,0.08)] text-[#f3d57c]";

  return (
    <div className={cn("hero-beam relative hidden min-h-[320px] overflow-hidden rounded-[1.8rem] border border-white/8 p-5 xl:block", className)}>
      <div className="absolute inset-0 premium-shell-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.03),transparent_34%)]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#c9c4bb]">
        {title}
      </div>
      {supportA ? (
        <div className={cn("absolute right-5 top-5 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.26em] backdrop-blur-xl", chipClasses)}>
          {supportA}
        </div>
      ) : null}
      {supportB ? (
        <div className={cn("absolute bottom-5 left-5 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.26em] backdrop-blur-xl", chipClasses)}>
          {supportB}
        </div>
      ) : null}
      <div className="absolute bottom-5 right-5 rounded-full border border-[rgba(224,185,75,0.18)] bg-[rgba(224,185,75,0.08)] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[#f3d57c]">
        {tag}
      </div>
      {children}
    </div>
  );
}

export function PageHeroVisual({ variant }: { variant: PageHeroVariant }) {
  const config = VISUALS[variant] ?? VISUALS.generic;

  return (
    <Frame
      title={config.title}
      tag={config.tag}
      className={config.className}
      chipTone={config.chipTone}
      supportA={config.supportA}
      supportB={config.supportB}
    >
      <DynamicPageHeroScene variant={variant} />
    </Frame>
  );
}
