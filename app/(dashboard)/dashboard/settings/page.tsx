"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, RefreshCcw, Settings2, Star, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { alertsApi, socialApi, userApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type { LinkedWallet, SocialVisibility, UserPreferences } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";

const providerOptions: Array<LinkedWallet["provider"]> = ["retix", "phantom", "solflare", "backpack"];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const authUser = useAuthStore((state) => state.user);
  const wallet = useActiveWallet();

  const profileQuery = useQuery({
    queryKey: ["user", "profile"],
    queryFn: userApi.profile,
    enabled: Boolean(authUser),
  });

  const preferencesQuery = useQuery({
    queryKey: ["user", "preferences"],
    queryFn: userApi.preferences,
    enabled: Boolean(authUser),
  });

  const watchlistQuery = useQuery({
    queryKey: ["user", "watchlist"],
    queryFn: userApi.watchlist,
    enabled: Boolean(authUser),
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: alertsApi.list,
    enabled: Boolean(authUser),
  });

  const profile = profileQuery.data || authUser || null;
  const linkedWallets = profile?.linkedWallets || [];
  const favoriteWallets = linkedWallets.filter((item) => item.favorite);
  const primaryWallet = linkedWallets.find((item) => item.isPrimary) || linkedWallets[0];
  const primaryWalletAddress = primaryWallet?.address || profile?.walletAddress || "";

  const socialProfileQuery = useQuery({
    queryKey: ["social", "profile", primaryWalletAddress],
    queryFn: () => socialApi.profile(primaryWalletAddress),
    enabled: Boolean(authUser && primaryWalletAddress),
  });

  const [profileDraft, setProfileDraft] = useState({
    name: "",
    avatar: "",
    preferredNetwork: "devnet" as "devnet" | "mainnet-beta" | "testnet",
  });
  const [preferencesDraft, setPreferencesDraft] = useState<UserPreferences>({
    autoRefreshEnabled: true,
    chartTimeframe: "24H",
    selectedCurrency: "usd",
    defaultDashboardTab: "wallet",
  });
  const [walletDraft, setWalletDraft] = useState({
    address: "",
    provider: "phantom" as LinkedWallet["provider"],
    label: "",
    notes: "",
    favorite: false,
    isPrimary: false,
  });
  const [socialDraft, setSocialDraft] = useState({
    displayName: "",
    bio: "",
    tags: "",
    visibility: "private" as SocialVisibility,
    isDiscoverable: false,
    showInLeaderboards: false,
    showInTrending: false,
    showPortfolioValue: true,
    showTokenBalances: true,
    showPnl: true,
    showNfts: true,
    showActivityFeed: true,
    showBadges: true,
    showSnapshots: true,
    showExposure: true,
    showRisk: true,
  });

  useEffect(() => {
    if (!profile) {
      return;
    }
    setProfileDraft({
      name: profile.name || "",
      avatar: profile.avatar || "",
      preferredNetwork: (profile.preferredNetwork as "devnet" | "mainnet-beta" | "testnet") || "devnet",
    });
  }, [profile]);

  useEffect(() => {
    if (!preferencesQuery.data?.preferences) {
      return;
    }
    setPreferencesDraft({
      autoRefreshEnabled: preferencesQuery.data.preferences.autoRefreshEnabled ?? true,
      chartTimeframe: preferencesQuery.data.preferences.chartTimeframe || "24H",
      selectedCurrency: preferencesQuery.data.preferences.selectedCurrency || "usd",
      defaultDashboardTab: preferencesQuery.data.preferences.defaultDashboardTab || "wallet",
      favoriteCoins: preferencesQuery.data.preferences.favoriteCoins || ["BTC", "ETH", "SOL"],
      marketView: preferencesQuery.data.preferences.marketView || "overview",
      watchlistLayout: preferencesQuery.data.preferences.watchlistLayout || "grid",
    });
  }, [preferencesQuery.data]);

  useEffect(() => {
    if (wallet.address && wallet.address !== walletDraft.address) {
      setWalletDraft((current) => ({
        ...current,
        address: current.address || wallet.address || "",
        provider: ((wallet.providerName || "phantom").toLowerCase() as LinkedWallet["provider"]) || "phantom",
      }));
    }
  }, [wallet.address, wallet.providerName, walletDraft.address]);

  useEffect(() => {
    if (!socialProfileQuery.data) {
      setSocialDraft({
        displayName: profile?.name || "",
        bio: "",
        tags: "",
        visibility: "private",
        isDiscoverable: false,
        showInLeaderboards: false,
        showInTrending: false,
        showPortfolioValue: true,
        showTokenBalances: true,
        showPnl: true,
        showNfts: true,
        showActivityFeed: true,
        showBadges: true,
        showSnapshots: true,
        showExposure: true,
        showRisk: true,
      });
      return;
    }

    setSocialDraft({
      displayName: socialProfileQuery.data.displayName || profile?.name || "",
      bio: socialProfileQuery.data.bio || "",
      tags: (socialProfileQuery.data.tags || []).join(", "),
      visibility: socialProfileQuery.data.visibility || "private",
      isDiscoverable: socialProfileQuery.data.profileSettings?.isDiscoverable ?? false,
      showInLeaderboards: socialProfileQuery.data.profileSettings?.showInLeaderboards ?? false,
      showInTrending: socialProfileQuery.data.profileSettings?.showInTrending ?? false,
      showPortfolioValue: socialProfileQuery.data.profileSettings?.visibilitySettings?.showPortfolioValue ?? true,
      showTokenBalances: socialProfileQuery.data.profileSettings?.visibilitySettings?.showTokenBalances ?? true,
      showPnl: socialProfileQuery.data.profileSettings?.visibilitySettings?.showPnl ?? true,
      showNfts: socialProfileQuery.data.profileSettings?.visibilitySettings?.showNfts ?? true,
      showActivityFeed: socialProfileQuery.data.profileSettings?.visibilitySettings?.showActivityFeed ?? true,
      showBadges: socialProfileQuery.data.profileSettings?.visibilitySettings?.showBadges ?? true,
      showSnapshots: socialProfileQuery.data.profileSettings?.visibilitySettings?.showSnapshots ?? true,
      showExposure: socialProfileQuery.data.profileSettings?.visibilitySettings?.showExposure ?? true,
      showRisk: socialProfileQuery.data.profileSettings?.visibilitySettings?.showRisk ?? true,
    });
  }, [profile?.name, socialProfileQuery.data]);

  const profileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (nextUser) => {
      updateUser({ ...(authUser || nextUser), ...nextUser });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Profile update failed"),
  });

  const preferencesMutation = useMutation({
    mutationFn: userApi.updatePreferences,
    onSuccess: (result) => {
      if (authUser) {
        updateUser({
          ...authUser,
          preferredNetwork: result.preferredNetwork,
          preferences: result.preferences,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Preferences saved");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Preference update failed"),
  });

  const linkWalletMutation = useMutation({
    mutationFn: userApi.linkWallet,
    onSuccess: (nextUser) => {
      updateUser({ ...(authUser || nextUser), ...nextUser });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setWalletDraft({
        address: wallet.address || "",
        provider: ((wallet.providerName || "phantom").toLowerCase() as LinkedWallet["provider"]) || "phantom",
        label: "",
        notes: "",
        favorite: false,
        isPrimary: false,
      });
      toast.success("Wallet saved");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to save wallet"),
  });

  const socialProfileMutation = useMutation({
    mutationFn: () =>
      socialApi.updateProfile(primaryWalletAddress, {
        displayName: socialDraft.displayName,
        bio: socialDraft.bio,
        tags: socialDraft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        visibility: socialDraft.visibility,
        isDiscoverable: socialDraft.isDiscoverable,
        showInLeaderboards: socialDraft.showInLeaderboards,
        showInTrending: socialDraft.showInTrending,
        visibilitySettings: {
          showPortfolioValue: socialDraft.showPortfolioValue,
          showTokenBalances: socialDraft.showTokenBalances,
          showPnl: socialDraft.showPnl,
          showNfts: socialDraft.showNfts,
          showActivityFeed: socialDraft.showActivityFeed,
          showBadges: socialDraft.showBadges,
          showSnapshots: socialDraft.showSnapshots,
          showExposure: socialDraft.showExposure,
          showRisk: socialDraft.showRisk,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["social"] });
      toast.success("Public social profile saved");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to save public profile"),
  });

  const dashboardTabOptions = useMemo(
    () => ["wallet", "dashboard", "markets", "trading", "analytics", "social", "security", "settings"],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Profile Settings"
        subtitle="Manage profile identity, auto refresh behavior, favorite wallets, wallet notes, and default product preferences from one secure settings surface."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={wallet.openConnectModal}>
              <WalletCards className="h-4 w-4" />
              {wallet.connected ? "Switch wallet provider" : "Connect wallet"}
            </Button>
            <Button onClick={() => preferencesMutation.mutate(preferencesDraft)} disabled={preferencesMutation.isPending}>
              <RefreshCcw className="h-4 w-4" />
              Save preferences
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Profile Identity" description="Update display information and preferred network used across the product.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={profileDraft.name} onChange={(event) => setProfileDraft((state) => ({ ...state, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Preferred network</Label>
              <Select
                value={profileDraft.preferredNetwork}
                onValueChange={(value: "devnet" | "mainnet-beta" | "testnet") =>
                  setProfileDraft((state) => ({ ...state, preferredNetwork: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devnet">Devnet</SelectItem>
                  <SelectItem value="testnet">Testnet</SelectItem>
                  <SelectItem value="mainnet-beta">Mainnet Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Avatar URL</Label>
              <Input value={profileDraft.avatar} onChange={(event) => setProfileDraft((state) => ({ ...state, avatar: event.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => profileMutation.mutate(profileDraft)} disabled={profileMutation.isPending}>
              Save profile
            </Button>
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
              Primary wallet: <span className="font-medium text-white">{primaryWallet?.address || profile?.walletAddress || "--"}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Workspace Preferences" description="Control live polling, chart defaults, preferred currency, and default landing tab.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div>
                <div className="text-sm font-medium text-white">Auto refresh</div>
                <div className="mt-1 text-sm text-slate-400">Toggle live polling for wallet, markets, and trading screens.</div>
              </div>
              <Switch
                checked={preferencesDraft.autoRefreshEnabled ?? true}
                onCheckedChange={(checked) => setPreferencesDraft((state) => ({ ...state, autoRefreshEnabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Default dashboard tab</Label>
              <Select
                value={preferencesDraft.defaultDashboardTab || "wallet"}
                onValueChange={(value) => setPreferencesDraft((state) => ({ ...state, defaultDashboardTab: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dashboardTabOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chart timeframe</Label>
              <Select
                value={preferencesDraft.chartTimeframe || "24H"}
                onValueChange={(value) =>
                  setPreferencesDraft((state) => ({ ...state, chartTimeframe: value as UserPreferences["chartTimeframe"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1H", "24H", "7D", "1M", "3M", "1Y", "MAX"].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Display currency</Label>
              <Select
                value={preferencesDraft.selectedCurrency || "usd"}
                onValueChange={(value: "usd" | "inr" | "krw") =>
                  setPreferencesDraft((state) => ({ ...state, selectedCurrency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="inr">INR</SelectItem>
                  <SelectItem value="krw">KRW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Public Wallet Profile"
        description="Opt into the Web3 Social Layer, control public visibility, and decide what portfolio intelligence is shared on your wallet profile."
        action={
          <Button onClick={() => socialProfileMutation.mutate()} disabled={socialProfileMutation.isPending || !primaryWalletAddress}>
            <Globe2 className="h-4 w-4" />
            Save public profile
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Public display name</Label>
              <Input value={socialDraft.displayName} onChange={(event) => setSocialDraft((state) => ({ ...state, displayName: event.target.value }))} placeholder="Wallet alias" />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={socialDraft.visibility} onValueChange={(value: SocialVisibility) => setSocialDraft((state) => ({ ...state, visibility: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="summary">Public summary</SelectItem>
                  <SelectItem value="public">Public full profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={socialDraft.bio} onChange={(event) => setSocialDraft((state) => ({ ...state, bio: event.target.value }))} placeholder="Describe trading style, staking focus, or governance identity..." />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={socialDraft.tags} onChange={(event) => setSocialDraft((state) => ({ ...state, tags: event.target.value }))} placeholder="trader, staker, governance participant" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["isDiscoverable", "Allow discovery"],
              ["showInTrending", "Show in trending"],
              ["showInLeaderboards", "Show in leaderboards"],
              ["showPortfolioValue", "Show portfolio value"],
              ["showTokenBalances", "Show token balances"],
              ["showPnl", "Show PnL"],
              ["showNfts", "Show NFTs"],
              ["showActivityFeed", "Show activity feed"],
              ["showBadges", "Show badges"],
              ["showSnapshots", "Show shared snapshots"],
              ["showExposure", "Show exposure metrics"],
              ["showRisk", "Show risk and reputation"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {label}
                <Switch
                  checked={Boolean(socialDraft[key as keyof typeof socialDraft])}
                  onCheckedChange={(checked) => setSocialDraft((state) => ({ ...state, [key]: checked } as typeof state))}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-cyan-400/15 bg-cyan-500/[0.05] p-4 text-sm text-slate-300">
          Public profile wallet: <span className="font-medium text-white">{primaryWalletAddress || "--"}</span>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Linked Wallets" description="Favorite wallets, multi-wallet switching hints, wallet notes, and primary wallet controls for the account.">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Add or update wallet</div>
                <div className="mt-4 grid gap-3">
                  <div className="space-y-2">
                    <Label>Wallet address</Label>
                    <Input value={walletDraft.address} onChange={(event) => setWalletDraft((state) => ({ ...state, address: event.target.value }))} placeholder="Wallet address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={walletDraft.provider}
                      onValueChange={(value: LinkedWallet["provider"]) =>
                        setWalletDraft((state) => ({ ...state, provider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providerOptions.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input value={walletDraft.label} onChange={(event) => setWalletDraft((state) => ({ ...state, label: event.target.value }))} placeholder="Treasury, personal, trading..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Wallet notes</Label>
                    <Textarea value={walletDraft.notes} onChange={(event) => setWalletDraft((state) => ({ ...state, notes: event.target.value }))} placeholder="Operational notes, risk context, contact owner..." />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                      Favorite wallet
                      <Switch
                        checked={walletDraft.favorite}
                        onCheckedChange={(checked) => setWalletDraft((state) => ({ ...state, favorite: checked }))}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                      Set as primary
                      <Switch
                        checked={walletDraft.isPrimary}
                        onCheckedChange={(checked) => setWalletDraft((state) => ({ ...state, isPrimary: checked }))}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => linkWalletMutation.mutate(walletDraft)} disabled={linkWalletMutation.isPending}>
                      Save linked wallet
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setWalletDraft({
                          address: wallet.address || "",
                          provider: ((wallet.providerName || "phantom").toLowerCase() as LinkedWallet["provider"]) || "phantom",
                          label: "Connected session",
                          notes: "",
                          favorite: false,
                          isPrimary: false,
                        })
                      }
                    >
                      Use connected wallet
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {linkedWallets.length > 0 ? (
                linkedWallets.map((item) => (
                  <div key={item.address} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-white">{item.label || item.address}</div>
                          {item.isPrimary ? <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">Primary</span> : null}
                          {item.favorite ? <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-200">Favorite</span> : null}
                        </div>
                        <div className="mt-2 text-sm text-slate-400">{item.address}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {item.provider} • {item.lastUsedAt ? `last used ${formatDate(item.lastUsedAt)}` : "newly linked"}
                        </div>
                        {item.notes ? <div className="mt-3 text-sm text-slate-300">{item.notes}</div> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            linkWalletMutation.mutate({
                              address: item.address,
                              provider: item.provider,
                              label: item.label,
                              notes: item.notes,
                              favorite: !item.favorite,
                              isPrimary: item.isPrimary,
                            })
                          }
                        >
                          <Star className={cn("h-4 w-4", item.favorite && "fill-current")} />
                          {item.favorite ? "Unfavorite" : "Favorite"}
                        </Button>
                        {!item.isPrimary ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              linkWalletMutation.mutate({
                                address: item.address,
                                provider: item.provider,
                                label: item.label,
                                notes: item.notes,
                                favorite: item.favorite,
                                isPrimary: true,
                              })
                            }
                          >
                            Set Primary
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                  No linked wallets saved yet. Add wallets here to create your multi-wallet switcher surface.
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Settings Intelligence" description="Saved product state and account-level utility signals.">
          <div className="grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Favorite wallets</div>
              <div className="mt-3 text-2xl font-semibold text-white">{favoriteWallets.length}</div>
              <div className="mt-1 text-sm text-slate-400">Linked wallets pinned for quick switching and operator focus.</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Saved alerts</div>
              <div className="mt-3 text-2xl font-semibold text-white">{alertsQuery.data?.length || 0}</div>
              <div className="mt-1 text-sm text-slate-400">Includes price, governance, protocol, and security triggers.</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">User watchlist items</div>
              <div className="mt-3 text-2xl font-semibold text-white">{watchlistQuery.data?.items.length || 0}</div>
              <div className="mt-1 text-sm text-slate-400">Persistent product watchlist linked to your authenticated account.</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Live refresh mode</div>
              <div className="mt-3 flex items-center gap-2 text-xl font-semibold text-white">
                <Settings2 className="h-5 w-5 text-cyan-300" />
                {preferencesDraft.autoRefreshEnabled ? "Enabled" : "Manual"}
              </div>
              <div className="mt-1 text-sm text-slate-400">Applied across wallet telemetry, market data, and trading dashboards.</div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
