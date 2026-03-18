"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { TopNavbar } from "@/components/layout/top-navbar";
import { cn } from "@/utils/cn";

function resolveShellAccent(pathname: string) {
  if (pathname.includes("/wallet") || pathname.includes("/transfer") || pathname.includes("/portfolio")) {
    return {
      leftGlow: "bg-[radial-gradient(circle,rgba(242,201,76,0.14),transparent_68%)]",
      rightGlow: "bg-[radial-gradient(circle,rgba(34,211,238,0.08),transparent_70%)]",
      label: "Wallet command center",
      beacon: "vault" as const,
    };
  }

  if (pathname.includes("/markets") || pathname.includes("/trading") || pathname.includes("/swap")) {
    return {
      leftGlow: "bg-[radial-gradient(circle,rgba(242,201,76,0.12),transparent_66%)]",
      rightGlow: "bg-[radial-gradient(circle,rgba(59,130,246,0.08),transparent_70%)]",
      label: "Market intelligence surface",
      beacon: "market" as const,
    };
  }

  if (pathname.includes("/analytics") || pathname.includes("/assistant") || pathname.includes("/strategy") || pathname.includes("/tax")) {
    return {
      leftGlow: "bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_66%)]",
      rightGlow: "bg-[radial-gradient(circle,rgba(242,201,76,0.1),transparent_70%)]",
      label: "Financial intelligence layer",
      beacon: "insight" as const,
    };
  }

  if (pathname.includes("/risk") || pathname.includes("/security") || pathname.includes("/network")) {
    return {
      leftGlow: "bg-[radial-gradient(circle,rgba(224,185,75,0.1),transparent_66%)]",
      rightGlow: "bg-[radial-gradient(circle,rgba(239,68,68,0.08),transparent_70%)]",
      label: "Defensive operations layer",
      beacon: "shield" as const,
    };
  }

  if (pathname.includes("/governance") || pathname.includes("/treasury") || pathname.includes("/admin")) {
    return {
      leftGlow: "bg-[radial-gradient(circle,rgba(242,201,76,0.12),transparent_66%)]",
      rightGlow: "bg-[radial-gradient(circle,rgba(34,211,238,0.06),transparent_70%)]",
      label: "Governance capital layer",
      beacon: "nodes" as const,
    };
  }

  if (pathname.includes("/social") || pathname.includes("/explorer") || pathname.includes("/devtools")) {
    return {
      leftGlow: "bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_66%)]",
      rightGlow: "bg-[radial-gradient(circle,rgba(242,201,76,0.08),transparent_70%)]",
      label: "Connected discovery surface",
      beacon: "lattice" as const,
    };
  }

  return {
    leftGlow: "bg-[radial-gradient(circle,rgba(242,201,76,0.12),transparent_68%)]",
    rightGlow: "bg-[radial-gradient(circle,rgba(34,211,238,0.07),transparent_70%)]",
    label: "Premium Web3 workspace",
    beacon: "halo" as const,
  };
}

function ShellBeaconGraphic({ kind }: { kind: "vault" | "market" | "insight" | "shield" | "nodes" | "lattice" | "halo" }) {
  if (kind === "vault") {
    return (
      <>
        <div className="absolute left-1/2 top-1/2 h-24 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-[rgba(242,201,76,0.28)] bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(242,201,76,0.1),rgba(16,18,19,0.94))]" />
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-[1rem] bg-[radial-gradient(circle,#f8e3a0_0%,#f2c94c_40%,rgba(28,22,11,0.96)_100%)] shadow-[0_0_32px_rgba(242,201,76,0.28)]" />
        <div className="hero-orbit absolute left-1/2 top-1/2 h-28 w-36 -translate-x-1/2 -translate-y-1/2 rounded-[1.8rem] border border-cyan-300/16" />
      </>
    );
  }

  if (kind === "market") {
    return (
      <>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 176 176" aria-hidden="true">
          <path d="M22 110 C44 102, 62 76, 86 84 S122 132, 148 66" fill="none" stroke="rgba(242,201,76,0.8)" strokeWidth="4" strokeLinecap="round" />
          <path d="M22 110 C44 102, 62 76, 86 84 S122 132, 148 66" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="10" strokeLinecap="round" />
        </svg>
        {[
          ["32%", "58%", "14px"],
          ["50%", "44%", "20px"],
          ["70%", "54%", "16px"],
        ].map(([left, top, size]) => (
          <div key={`${left}-${top}`} className="absolute rounded-full bg-[radial-gradient(circle,#fff2cb_0%,#f2c94c_42%,rgba(28,22,11,0.96)_100%)] shadow-[0_0_24px_rgba(242,201,76,0.22)]" style={{ left, top, width: size, height: size }} />
        ))}
      </>
    );
  }

  if (kind === "insight") {
    return (
      <>
        <div className="hero-glow-pulse absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fff2cb_0%,#f2c94c_32%,rgba(34,211,238,0.34)_58%,rgba(8,10,12,0.98)_100%)]" />
        {[
          ["26%", "42%"],
          ["70%", "34%"],
          ["64%", "68%"],
          ["34%", "70%"],
        ].map(([left, top], index) => (
          <div key={`${left}-${top}`} className={cn("absolute h-8 w-8 rounded-full border", index % 2 === 0 ? "border-cyan-300/22 bg-cyan-300/10" : "border-[rgba(242,201,76,0.24)] bg-[rgba(242,201,76,0.08)]")} style={{ left, top }} />
        ))}
      </>
    );
  }

  if (kind === "shield") {
    return (
      <>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 176 176" aria-hidden="true">
          <path d="M88 28 L126 44 V84 C126 114 111 134 88 148 C65 134 50 114 50 84 V44 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(242,201,76,0.42)" strokeWidth="4" />
          <path d="M88 48 L112 58 V84 C112 102 102 116 88 126 C74 116 64 102 64 84 V58 Z" fill="none" stroke="rgba(34,211,238,0.42)" strokeWidth="3" />
        </svg>
        <div className="hero-orbit absolute left-1/2 top-1/2 h-24 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/18" />
      </>
    );
  }

  if (kind === "nodes") {
    return (
      <>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 176 176" aria-hidden="true">
          <line x1="88" y1="44" x2="48" y2="88" stroke="rgba(242,201,76,0.28)" strokeWidth="2" />
          <line x1="88" y1="44" x2="128" y2="82" stroke="rgba(242,201,76,0.28)" strokeWidth="2" />
          <line x1="88" y1="44" x2="92" y2="128" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          {[
            ["88", "44", "16", "rgba(242,201,76,0.88)"],
            ["48", "88", "10", "rgba(34,211,238,0.78)"],
            ["128", "82", "10", "rgba(242,201,76,0.78)"],
            ["92", "128", "12", "rgba(34,211,238,0.84)"],
          ].map(([cx, cy, r, fill]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} />
          ))}
        </svg>
      </>
    );
  }

  if (kind === "lattice") {
    return (
      <>
        {[
          ["30%", "34%"],
          ["52%", "48%"],
          ["72%", "30%"],
        ].map(([left, top], index) => (
          <div key={`${left}-${top}`} className={cn("absolute h-12 w-12 rounded-2xl border", index === 1 ? "border-cyan-300/20 bg-cyan-300/10" : "border-[rgba(242,201,76,0.22)] bg-[rgba(255,255,255,0.05)]")} style={{ left, top }} />
        ))}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 176 176" aria-hidden="true">
          <line x1="54" y1="64" x2="92" y2="88" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
          <line x1="104" y1="88" x2="132" y2="58" stroke="rgba(242,201,76,0.36)" strokeWidth="2" />
        </svg>
      </>
    );
  }

  return (
    <>
      <div className="hero-glow-pulse absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#f8e3a0_0%,#f2c94c_36%,rgba(28,22,11,0.96)_100%)] shadow-[0_0_34px_rgba(242,201,76,0.24)]" />
      <div className="ambient-drift absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(242,201,76,0.32)]" />
      <div className="hero-orbit absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />
    </>
  );
}

function ShellCommandBeacon({
  kind,
}: {
  kind: "vault" | "market" | "insight" | "shield" | "nodes" | "lattice" | "halo";
}) {
  return (
    <div className="pointer-events-none absolute bottom-6 right-6 hidden h-44 w-44 overflow-hidden rounded-[1.8rem] border border-[rgba(224,185,75,0.14)] bg-[rgba(16,18,19,0.72)] shadow-[0_30px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl xl:block">
      <div className="absolute inset-0 premium-shell-grid opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(242,201,76,0.08),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(34,211,238,0.06),transparent_22%)]" />
      <ShellBeaconGraphic kind={kind} />
      <div className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.3em] text-[#8e877b]">Command core</div>
      <div className="absolute bottom-4 left-4 rounded-full border border-[rgba(242,201,76,0.18)] bg-[rgba(242,201,76,0.08)] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[#f3d57c]">
        Synced
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const accent = useMemo(() => resolveShellAccent(pathname), [pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden px-2 pb-8 pt-2 md:px-4 md:pb-10 md:pt-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 premium-shell-grid opacity-45" />
        <div className={cn("absolute left-[6%] top-8 h-72 w-72 blur-[130px]", accent.leftGlow)} />
        <div className={cn("absolute right-[4%] top-20 h-80 w-80 blur-[140px]", accent.rightGlow)} />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 bg-[radial-gradient(circle,rgba(242,201,76,0.06),transparent_68%)] blur-[150px]" />
      </div>

      <div className="page-shell mx-auto max-w-[1560px] overflow-visible">
        <div className="relative border-b border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-3 md:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(242,201,76,0.08),transparent_26%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f2c94c] shadow-[0_0_16px_rgba(242,201,76,0.78)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300/70" />
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#8e877b]">
              {accent.label}
            </div>
          </div>
        </div>

        <TopNavbar />

        <main className="relative mx-auto max-w-[1500px] px-4 py-6 md:px-6 md:py-8 xl:px-8">
          {children}
          <ShellCommandBeacon kind={accent.beacon} />
        </main>
      </div>
    </div>
  );
}
