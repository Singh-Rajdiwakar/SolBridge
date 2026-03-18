import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  CandlestickChart,
  DatabaseZap,
  ImageIcon,
  Landmark,
  SearchCode,
  Settings2,
  Shield,
  Sparkles,
  TerminalSquare,
  TriangleAlert,
  Vote,
  Wallet,
} from "lucide-react";

import { PageHeroVisual, type PageHeroVariant } from "@/components/dashboard/page-hero-visual";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

type HeaderTheme = {
  icon: LucideIcon;
  eyebrow: string;
  chips: string[];
  accent: "gold" | "cyan" | "rose";
  visual: PageHeroVariant;
};

function resolveHeaderTheme(title: string): HeaderTheme {
  const value = title.toLowerCase();

  if (value.includes("retix wallet") || value.includes("wallet")) {
    return {
      icon: Wallet,
      eyebrow: "Wallet command center",
      chips: ["Vault telemetry", "Secure execution", "On-chain verified"],
      accent: "gold",
      visual: "wallet",
    };
  }

  if (value.includes("live markets") || value.includes("markets")) {
    return {
      icon: BarChart3,
      eyebrow: "Market intelligence surface",
      chips: ["Live pricing", "Signal-rich", "Chart aware"],
      accent: "gold",
      visual: "markets",
    };
  }

  if (value.includes("trading")) {
    return {
      icon: CandlestickChart,
      eyebrow: "Execution-focused terminal",
      chips: ["High tempo", "Signal active", "Terminal depth"],
      accent: "gold",
      visual: "trading",
    };
  }

  if (value.includes("send / receive") || value.includes("transfer")) {
    return {
      icon: Wallet,
      eyebrow: "Transfer execution layer",
      chips: ["Route visible", "Fee aware", "Trusted workflow"],
      accent: "cyan",
      visual: "transfer",
    };
  }

  if (value.includes("staking")) {
    return {
      icon: Wallet,
      eyebrow: "Yield engine",
      chips: ["Reward forecast", "Calm accrual", "Lock intelligence"],
      accent: "gold",
      visual: "stake",
    };
  }

  if (value.includes("liquidity")) {
    return {
      icon: DatabaseZap,
      eyebrow: "Liquidity intelligence",
      chips: ["Reserve flow", "LP analytics", "IL aware"],
      accent: "cyan",
      visual: "pools",
    };
  }

  if (value.includes("borrow") || value.includes("lend")) {
    return {
      icon: Landmark,
      eyebrow: "Capital efficiency layer",
      chips: ["Collateral aware", "Debt monitored", "Health factor"],
      accent: "gold",
      visual: "borrow",
    };
  }

  if (value.includes("governance")) {
    return {
      icon: Vote,
      eyebrow: "DAO decision surface",
      chips: ["Voting depth", "Proposal visibility", "Institutional pacing"],
      accent: "gold",
      visual: "governance",
    };
  }

  if (value.includes("treasury")) {
    return {
      icon: Landmark,
      eyebrow: "Protocol capital layer",
      chips: ["Reserve strength", "Runway tracked", "Treasury transparency"],
      accent: "gold",
      visual: "treasury",
    };
  }

  if (value.includes("token")) {
    return {
      icon: Sparkles,
      eyebrow: "Mint and supply surface",
      chips: ["Authority visible", "Mint precision", "Explorer ready"],
      accent: "gold",
      visual: "tokens",
    };
  }

  if (value.includes("nft")) {
    return {
      icon: ImageIcon,
      eyebrow: "Collector intelligence",
      chips: ["Gallery premium", "Rarity aware", "Holographic depth"],
      accent: "cyan",
      visual: "nfts",
    };
  }

  if (value.includes("swap")) {
    return {
      icon: Sparkles,
      eyebrow: "Conversion engine",
      chips: ["Route preview", "Fee aware", "Exchange live"],
      accent: "gold",
      visual: "swap",
    };
  }

  if (value.includes("analytics")) {
    return {
      icon: BarChart3,
      eyebrow: "Financial intelligence layer",
      chips: ["PnL visibility", "Insight engine", "Data-rich"],
      accent: "cyan",
      visual: "analytics",
    };
  }

  if (value.includes("assistant")) {
    return {
      icon: BrainCircuit,
      eyebrow: "AI financial intelligence",
      chips: ["Explainable", "Rule based", "Action linked"],
      accent: "cyan",
      visual: "assistant",
    };
  }

  if (value.includes("strategy")) {
    return {
      icon: BarChart3,
      eyebrow: "Institutional planning surface",
      chips: ["Stress tested", "Allocation aware", "Yield modeled"],
      accent: "gold",
      visual: "strategy",
    };
  }

  if (value.includes("tax")) {
    return {
      icon: BarChart3,
      eyebrow: "Financial reporting layer",
      chips: ["Export ready", "Yearly reporting", "Taxable events"],
      accent: "gold",
      visual: "tax",
    };
  }

  if (value.includes("risk")) {
    return {
      icon: TriangleAlert,
      eyebrow: "Risk intelligence",
      chips: ["Stress aware", "Drawdown visible", "Resilience tracked"],
      accent: "rose",
      visual: "risk",
    };
  }

  if (value.includes("social")) {
    return {
      icon: Sparkles,
      eyebrow: "Web3 community layer",
      chips: ["Wallet discovery", "Networked signals", "Public profiles"],
      accent: "cyan",
      visual: "social",
    };
  }

  if (value.includes("security")) {
    return {
      icon: Shield,
      eyebrow: "Protective operations layer",
      chips: ["Fraud scanning", "Defense active", "Risk watch"],
      accent: "rose",
      visual: "security",
    };
  }

  if (value.includes("network")) {
    return {
      icon: Activity,
      eyebrow: "Infrastructure observability",
      chips: ["TPS tracked", "Latency visible", "Validator health"],
      accent: "cyan",
      visual: "network",
    };
  }

  if (value.includes("explorer") || value.includes("blockchain check")) {
    return {
      icon: SearchCode,
      eyebrow: "On-chain verification console",
      chips: ["Traceability", "Search active", "Explorer linked"],
      accent: "cyan",
      visual: "explorer",
    };
  }

  if (value.includes("devtools") || value.includes("developer")) {
    return {
      icon: TerminalSquare,
      eyebrow: "Developer execution surface",
      chips: ["Contract console", "IDL aware", "Debug ready"],
      accent: "gold",
      visual: "devtools",
    };
  }

  if (value.includes("portfolio")) {
    return {
      icon: Wallet,
      eyebrow: "Executive wealth view",
      chips: ["Allocation live", "Value tracked", "Yield visible"],
      accent: "gold",
      visual: "portfolio",
    };
  }

  if (value.includes("settings")) {
    return {
      icon: Settings2,
      eyebrow: "Workspace configuration",
      chips: ["Profile control", "Preferences saved", "Privacy aware"],
      accent: "gold",
      visual: "settings",
    };
  }

  if (value.includes("admin")) {
    return {
      icon: Settings2,
      eyebrow: "Protocol control room",
      chips: ["Privileged access", "Emergency ready", "Config visible"],
      accent: "gold",
      visual: "admin",
    };
  }

  if (value.includes("dashboard")) {
    return {
      icon: Sparkles,
      eyebrow: "Executive protocol surface",
      chips: ["Command center", "Protocol visibility", "Market aware"],
      accent: "gold",
      visual: "dashboard",
    };
  }

  return {
    icon: Sparkles,
    eyebrow: "Cinematic product surface",
    chips: ["Premium UI", "On-chain aware", "Live ecosystem"],
    accent: "gold",
    visual: "generic",
  };
}

export function PageHeader({
  title,
  subtitle,
  badge,
  action,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  action?: ReactNode;
}) {
  const theme = resolveHeaderTheme(title);
  const Icon = theme.icon;
  const accentClasses =
    theme.accent === "cyan"
      ? "border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.08)] text-cyan-200"
      : theme.accent === "rose"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
        : "border-[rgba(224,185,75,0.2)] bg-[rgba(224,185,75,0.08)] text-[#f3d57c]";

  return (
    <div className="page-hero-shell mb-8 p-6 md:p-8 xl:p-9">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(242,201,76,0.12),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(34,211,238,0.08),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 premium-shell-grid opacity-50" />
      <div className="relative grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="page-kicker">
              <span className="page-kicker-dot" />
              {badge || theme.eyebrow}
            </div>
            <Badge variant="muted" className="rounded-full px-3 py-1 text-[10px] tracking-[0.26em]">
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              On-chain live
            </Badge>
          </div>
          <h1 className="page-hero-heading mt-5 max-w-[12ch] text-4xl md:text-[3.6rem] xl:text-[4.5rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#c9c4bb] md:text-lg">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {theme.chips.map((chip) => (
              <div
                key={chip}
                className={cn(
                  "inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] backdrop-blur-xl",
                  accentClasses,
                )}
              >
                {chip}
              </div>
            ))}
          </div>
          {action ? <div className="mt-8 flex flex-wrap gap-3">{action}</div> : null}
        </div>

        <PageHeroVisual variant={theme.visual} />
      </div>
    </div>
  );
}
