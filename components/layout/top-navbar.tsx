"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, LogOut, Menu, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { WalletButton } from "@/components/layout/wallet-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NetworkBadge } from "@/components/wallet/NetworkBadge";
import { ProviderChip } from "@/components/wallet/ProviderChip";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { NAV_ITEMS } from "@/lib/constants";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/utils/cn";
import { formatCompactCurrency } from "@/utils/format";

function splitNavItems<T>(items: T[]) {
  const middle = Math.ceil(items.length / 2);
  return [items.slice(0, middle), items.slice(middle)] as const;
}

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const walletFiatValue = user?.balances?.reduce((total, balance) => total + balance.fiatValue, 0) || 0;
  const { connected, providerName, address } = useActiveWallet();

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.id !== "admin" || user?.role === "admin"),
    [user?.role],
  );
  const [topRow, bottomRow] = useMemo(() => splitNavItems(navItems), [navItems]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authApi.logout();
    } catch {
      // Clear local session even if the API call fails.
    } finally {
      clearAuth();
      setMobileOpen(false);
      setLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <>
      <div className="sticky top-3 z-40 px-3 pt-3 md:px-5">
        <div className="rounded-[1.8rem] border border-[rgba(224,185,75,0.14)] bg-[rgba(12,13,14,0.8)] shadow-[0_28px_80px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
          <div className="relative overflow-hidden px-4 py-4 md:px-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(242,201,76,0.08),transparent_24%),radial-gradient(circle_at_right,rgba(34,211,238,0.05),transparent_20%)]" />
            <div className="relative flex flex-wrap items-center gap-3 xl:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Link href="/dashboard/wallet" className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(242,201,76,0.18)] bg-[linear-gradient(145deg,rgba(242,201,76,0.18),rgba(16,17,18,0.9))] shadow-[0_18px_54px_rgba(0,0,0,0.24)]">
                    <span className="font-mono text-lg font-semibold tracking-[0.18em] text-[#f2c94c]">RW</span>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tracking-[-0.05em] text-white">Retix Wallet</div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-[#8e877b]">Luxury Solana workspace</div>
                  </div>
                </Link>
              </div>

              <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2.5">
                <div className="hidden items-center gap-2 rounded-full border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] px-4 py-2 xl:flex">
                  <Sparkles className="h-4 w-4 text-[#f2c94c]" />
                  <span className="text-sm text-[#c9c4bb]">{connected ? "Wallet synced" : "Standby mode"}</span>
                  <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-400 shadow-[0_0_16px_rgba(34,197,94,0.8)]" : "bg-[#8e877b]")} />
                </div>

                <div className="hidden rounded-2xl border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 2xl:block">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#8e877b]">Portfolio value</div>
                  <div className="mt-1 text-sm font-semibold text-white">{formatCompactCurrency(walletFiatValue)}</div>
                </div>

                {connected ? (
                  <>
                    <NetworkBadge className="hidden lg:inline-flex" />
                    <ProviderChip provider={providerName || "Retix Wallet"} className="hidden 2xl:inline-flex" />
                  </>
                ) : null}

                <Button variant="secondary" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <WalletButton />

                <div className="hidden items-center gap-3 rounded-2xl border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-2 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(242,201,76,0.16)] bg-[rgba(242,201,76,0.08)] text-sm font-semibold text-[#f3d57c]">
                    {user?.name?.slice(0, 1) || "U"}
                  </div>
                  <div className="hidden xl:block">
                    <div className="text-sm font-semibold text-white">{user?.name || "Guest"}</div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#8e877b]">
                      {connected ? address?.slice(0, 8) : "wallet standby"}
                    </div>
                  </div>
                  {user?.role === "admin" ? <Badge className="hidden 2xl:inline-flex">Admin</Badge> : null}
                </div>

                {user ? (
                  <Button
                    variant="secondary"
                    className="hidden border-rose-400/16 bg-rose-500/8 text-rose-100 hover:border-rose-300/32 hover:bg-rose-500/14 xl:inline-flex"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Logging out" : "Logout"}
                  </Button>
                ) : null}

                <Button variant="secondary" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-4 md:px-5">
            <div className="hidden gap-3 md:grid">
              {[topRow, bottomRow].map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap gap-2.5">
                  {row.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                          active
                            ? "border-[rgba(224,185,75,0.22)] bg-[rgba(224,185,75,0.12)] text-white shadow-[0_12px_30px_rgba(224,185,75,0.08)]"
                            : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#c9c4bb] hover:border-[rgba(224,185,75,0.18)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/78 backdrop-blur-md md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-[86vw] max-w-sm border-l border-[rgba(224,185,75,0.14)] bg-[rgba(10,11,12,0.98)] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold text-white">Navigation</div>
                <div className="text-sm text-[#c9c4bb]">Premium app routes</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6 rounded-[1.4rem] border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(242,201,76,0.16)] bg-[rgba(242,201,76,0.08)] text-sm font-semibold text-[#f3d57c]">
                  {user?.name?.slice(0, 1) || "U"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{user?.name || "Guest session"}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#8e877b]">
                    {connected ? providerName || "Retix Wallet" : "Wallet standby"}
                  </div>
                </div>
              </div>
              {user ? (
                <Button
                  variant="secondary"
                  className="mt-4 w-full justify-center border-rose-400/16 bg-rose-500/8 text-rose-100 hover:border-rose-300/32 hover:bg-rose-500/14"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Logging out" : "Logout"}
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                      active
                        ? "border-[rgba(224,185,75,0.22)] bg-[rgba(224,185,75,0.12)] text-white"
                        : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[#c9c4bb]",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
