"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { ArrowUpDown, Blocks, ExternalLink, FileDown, Plus, Star, TerminalSquare, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  AIAdvisorPanel,
  AddressBookCard,
  AddressInteractionRadar,
  AssetTable,
  BlockchainTransparencyPanel,
  CreateTokenPanel,
  GasOptimizerWidget,
  NetworkHealthPanel,
  NFTGalleryCard,
  RecentTransactionsPanel,
  ReceiveModal,
  SecurityHudCard,
  SecurityAlertPanel,
  SendPanel,
  SwapPanel,
  TokenDetailDrawer,
  TransactionFlowVisualizer,
  TransactionStatusCard,
  WalletActivityTimeline,
  WalletAnalyticsCharts,
  WalletHeroCard,
  WalletInsights,
  WalletTerminalDrawer,
  WalletTicker,
  WalletUltraBackground,
  WalletOverviewCard,
  WalletRiskCard,
  WhySolanaPanel,
} from "@/components/wallet";
import { Button } from "@/components/ui/button";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { useGovernance } from "@/hooks/useGovernance";
import { useLending } from "@/hooks/useLending";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useStaking } from "@/hooks/useStaking";
import { DEFAULT_SOL_FEE, shortenAddress } from "@/lib/solana";
import { addressBookApi, aiApi, gasApi, securityApi, walletApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type {
  AddressBookEntry,
  OnChainProgramStatus,
  WalletCreateTokenInput,
  WalletSendInput,
  WalletTokenBalance,
} from "@/types";
import { formatNumber } from "@/utils/format";

type SwapDraft = {
  fromToken: string;
  toToken: string;
  amount: number;
  slippage: number;
};

type ExecutionState = {
  status: "Pending" | "Confirmed" | "Failed";
  title: string;
  signature?: string | null;
  timestamp?: string | null;
};

type CreatedTokenResult = {
  mintAddress: string;
  transactionSignature?: string;
  symbol?: string;
  decimals?: number;
  initialSupply?: number;
};

function toBaseUnits(amount: number, decimals: number) {
  const [wholePart = "0", fractionalPart = ""] = amount.toString().split(".");
  const normalizedFractional = `${fractionalPart}${"0".repeat(decimals)}`.slice(0, decimals);
  return BigInt(`${wholePart}${normalizedFractional || ""}` || "0");
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const {
    address,
    publicKey,
    connected,
    providerName,
    connection,
    openConnectModal,
    signAndSendTransaction,
  } = useActiveWallet();
  const network = "Devnet";
  const staking = useStaking();
  const liquidity = useLiquidity();
  const lending = useLending();
  const governance = useGovernance();

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [createdTokenResult, setCreatedTokenResult] = useState<CreatedTokenResult | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [selectedToken, setSelectedToken] = useState<WalletTokenBalance | null>(null);
  const [prefillReceiver, setPrefillReceiver] = useState<string | null>(null);
  const [transferDraft, setTransferDraft] = useState({
    receiver: "",
    amount: 0,
    valid: false,
    fee: DEFAULT_SOL_FEE,
  });
  const [flowPreviewState, setFlowPreviewState] = useState<"idle" | "previewing" | "ready">("idle");
  const seenAlertIdsRef = useRef<Set<string>>(new Set());
  const [swapDraft, setSwapDraft] = useState<SwapDraft>({
    fromToken: "SOL",
    toToken: "USDC",
    amount: 0.5,
    slippage: 0.5,
  });

  const balanceQuery = useQuery({
    queryKey: ["wallet", "balance", address, providerName],
    queryFn: () => walletApi.balance(address!, providerName || "Retix Wallet"),
    enabled: Boolean(address),
  });

  const portfolioQuery = useQuery({
    queryKey: ["wallet", "portfolio", address, providerName],
    queryFn: () => walletApi.portfolio(address!, providerName || "Retix Wallet"),
    enabled: Boolean(address),
  });

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions", address],
    queryFn: () => walletApi.transactions(address!),
    enabled: Boolean(address),
  });

  const nftQuery = useQuery({
    queryKey: ["wallet", "nfts", address],
    queryFn: () => walletApi.nfts(address!),
    enabled: Boolean(address),
  });

  const insightsQuery = useQuery({
    queryKey: ["wallet", "insights", address],
    queryFn: () => walletApi.insights(address!),
    enabled: Boolean(address),
  });

  const addressBookQuery = useQuery({
    queryKey: ["wallet", "address-book"],
    queryFn: () => addressBookApi.list(),
    enabled: Boolean(authUser),
  });

  const walletScoreQuery = useQuery({
    queryKey: ["wallet", "wallet-score", address],
    queryFn: () => securityApi.walletScore(address!),
    enabled: Boolean(address),
  });

  const gasOptimizationQuery = useQuery({
    queryKey: ["wallet", "gas-optimization", address],
    queryFn: () => gasApi.optimize(address!),
    enabled: Boolean(address),
    staleTime: 1000 * 30,
  });

  const alertsQuery = useQuery({
    queryKey: ["wallet", "security-alerts", address],
    queryFn: () => securityApi.alerts(address!),
    enabled: Boolean(address),
    refetchInterval: 1000 * 45,
  });

  const swapPreviewQuery = useQuery({
    queryKey: ["wallet", "swap-preview", address, providerName, swapDraft],
    queryFn: () =>
      walletApi.swap({
        address: address!,
        provider: providerName || "Retix Wallet",
        mode: "preview",
        ...swapDraft,
      }),
    enabled: Boolean(address) && swapDraft.amount > 0 && swapDraft.fromToken !== swapDraft.toToken,
  });

  const createAddressMutation = useMutation({
    mutationFn: (payload: { name: string; walletAddress: string; network?: string; notes?: string }) =>
      addressBookApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "address-book"] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; walletAddress?: string; network?: string; notes?: string };
    }) => addressBookApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "address-book"] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressBookApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "address-book"] });
    },
  });

  const sendMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Sending SOL",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async (values: WalletSendInput) => {
      if (!publicKey || !address) {
        throw new Error("Connect a wallet first.");
      }

      const balanceSol = balanceQuery.data?.balanceSol || 0;
      if (values.amount + DEFAULT_SOL_FEE >= balanceSol) {
        throw new Error("Insufficient balance for this transfer.");
      }

      const securityCheck = await securityApi.checkTransaction({
        walletAddress: address,
        receiverAddress: values.receiver,
        amount: values.amount,
        token: "SOL",
      });
      if (securityCheck.blocked) {
        throw new Error("Retix AI blocked this receiver as high-risk.");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(values.receiver),
          lamports: Math.round(values.amount * LAMPORTS_PER_SOL),
        }),
      );

      const signature = await signAndSendTransaction(transaction);
      await walletApi.send({
        address,
        receiver: values.receiver,
        amount: values.amount,
        signature,
        provider: providerName || "Retix Wallet",
        note: values.note,
      });

      return signature;
    },
    onSuccess: (signature) => {
      setExecutionState({
        status: "Confirmed",
        title: "SOL transfer confirmed",
        signature,
        timestamp: new Date().toISOString(),
      });
      toast.success("SOL sent successfully");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "SOL transfer failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Failed to send SOL");
    },
  });

  const airdropMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Requesting Devnet airdrop",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async () => {
      if (!address) {
        throw new Error("Connect a wallet first.");
      }

      return walletApi.airdrop({ address, amount: 1 });
    },
    onSuccess: (result) => {
      setExecutionState({
        status: "Confirmed",
        title: "Airdrop received",
        signature: typeof result.signature === "string" ? result.signature : undefined,
        timestamp: new Date().toISOString(),
      });
      toast.success("Airdrop successful");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "Airdrop request failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Airdrop failed");
    },
  });

  const swapMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Executing swap simulation",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async (values: SwapDraft) => {
      if (!address) {
        throw new Error("Connect a wallet first.");
      }

      return walletApi.swap({
        address,
        provider: providerName || "Retix Wallet",
        mode: "execute",
        ...values,
      });
    },
    onSuccess: (result) => {
      setExecutionState({
        status: "Confirmed",
        title: "Swap simulation confirmed",
        signature: result.transaction?.signature,
        timestamp: new Date().toISOString(),
      });
      toast.success("Swap preview confirmed");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "Swap simulation failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Swap failed");
    },
  });

  const createTokenMutation = useMutation({
    onMutate: () => {
      setExecutionState({
        status: "Pending",
        title: "Minting SPL token",
        timestamp: new Date().toISOString(),
      });
    },
    mutationFn: async (values: WalletCreateTokenInput) => {
      if (!publicKey || !address) {
        throw new Error("Connect a wallet first.");
      }

      const mintKeypair = Keypair.generate();
      const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE, "confirmed");
      const associatedTokenAddress = getAssociatedTokenAddressSync(mintKeypair.publicKey, publicKey);
      const mintAmount = toBaseUnits(values.initialSupply, values.decimals);
      const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mintKeypair.publicKey, values.decimals, publicKey, publicKey),
        createAssociatedTokenAccountInstruction(publicKey, associatedTokenAddress, publicKey, mintKeypair.publicKey),
        createMintToInstruction(mintKeypair.publicKey, associatedTokenAddress, publicKey, mintAmount),
      );

      const signature = await signAndSendTransaction(mintTransaction, [mintKeypair]);
      const result = await walletApi.createToken({
        address,
        mintAddress: mintKeypair.publicKey.toBase58(),
        signature,
        name: values.name,
        symbol: values.symbol.toUpperCase(),
        decimals: values.decimals,
        initialSupply: values.initialSupply,
        provider: providerName || "Retix Wallet",
      });

      return {
        mintAddress: result.mintAddress as string,
        transactionSignature: result.transactionSignature as string | undefined,
        symbol: values.symbol.toUpperCase(),
        decimals: values.decimals,
        initialSupply: values.initialSupply,
      };
    },
    onSuccess: (result) => {
      setCreatedTokenResult(result);
      setExecutionState({
        status: "Confirmed",
        title: "SPL token minted on Devnet",
        signature: result.transactionSignature,
        timestamp: new Date().toISOString(),
      });
      toast.success("SPL token created successfully");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: unknown) => {
      setExecutionState({
        status: "Failed",
        title: "SPL token mint failed",
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Token creation failed");
    },
  });

  const portfolioTokens = useMemo(
    () => portfolioQuery.data?.tokens || balanceQuery.data?.tokens || [],
    [balanceQuery.data?.tokens, portfolioQuery.data?.tokens],
  );
  const balanceHistory = useMemo(
    () => portfolioQuery.data?.balanceHistory || [],
    [portfolioQuery.data?.balanceHistory],
  );
  const transactions = transactionsQuery.data?.items || [];
  const addressBook = addressBookQuery.data || [];
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);

  const portfolioAdviceQuery = useQuery({
    queryKey: ["wallet", "portfolio-advice", address, portfolioTokens, balanceHistory],
    queryFn: () =>
      aiApi.portfolioAdvice({
        portfolio: portfolioTokens.map((token) => ({
          symbol: token.symbol,
          balance: token.balance,
          value: token.usdValue,
          change24h: token.change,
        })),
        historicalData: balanceHistory,
      }),
    enabled: Boolean(address) && portfolioTokens.length > 0,
  });

  useEffect(() => {
    alerts.forEach((alert) => {
      if (seenAlertIdsRef.current.has(alert.id) || alert.severity === "success") {
        return;
      }

      seenAlertIdsRef.current.add(alert.id);
      if (alert.severity === "danger") {
        toast.error(alert.title);
        return;
      }
      if (alert.severity === "warning" || alert.severity === "caution") {
        toast.warning(alert.title);
        return;
      }
      toast.info(alert.title);
    });
  }, [alerts]);

  const portfolioChange = useMemo(() => {
    if (balanceHistory.length < 2) {
      return portfolioTokens.reduce((sum, token) => sum + token.change, 0) / Math.max(portfolioTokens.length, 1);
    }
    const first = balanceHistory[0]?.value || 0;
    const last = balanceHistory.at(-1)?.value || 0;
    return first ? ((last - first) / first) * 100 : 0;
  }, [balanceHistory, portfolioTokens]);

  const walletAgeLabel = useMemo(() => {
    if (!authUser?.createdAt) {
      return "New wallet profile";
    }
    const diffDays = Math.max(
      1,
      Math.round((Date.now() - new Date(authUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    );
    return `${diffDays} day wallet age`;
  }, [authUser?.createdAt]);

  const activityLabel = useMemo(() => {
    if (transactions.length >= 8) {
      return "High activity";
    }
    if (transactions.length >= 4) {
      return "Moderate activity";
    }
    return "Low activity";
  }, [transactions.length]);

  const lockedBalance = useMemo(
    () => Number(((balanceQuery.data?.balanceSol || 0) * 0.18).toFixed(4)),
    [balanceQuery.data?.balanceSol],
  );

  const latencyMs = useMemo(() => {
    switch (gasOptimizationQuery.data?.congestionLevel) {
      case "Low":
        return 380;
      case "Moderate":
        return 620;
      case "High":
        return 980;
      default:
        return 540;
    }
  }, [gasOptimizationQuery.data?.congestionLevel]);

  const transactionSpeed = useMemo(() => {
    switch (gasOptimizationQuery.data?.congestionLevel) {
      case "Low":
        return "Fast";
      case "Moderate":
        return "Stable";
      case "High":
        return "Delayed";
      default:
        return "Syncing";
    }
  }, [gasOptimizationQuery.data?.congestionLevel]);

  const protocolStatuses = useMemo(
    () =>
      [
        staking.configQuery.data?.program,
        liquidity.poolsQuery.data?.program,
        lending.marketsQuery.data?.program,
        governance.configQuery.data?.program,
      ].filter((status): status is OnChainProgramStatus => Boolean(status)),
    [
      governance.configQuery.data?.program,
      lending.marketsQuery.data?.program,
      liquidity.poolsQuery.data?.program,
      staking.configQuery.data?.program,
    ],
  );

  const protocolTiles = useMemo(
    () => [
      {
        label: "On-chain staked",
        value: formatNumber((staking.positionsQuery.data || []).reduce((sum, position) => sum + position.amount, 0), 4),
        detail: `${staking.positionsQuery.data?.length || 0} staking positions`,
      },
      {
        label: "LP balance",
        value: formatNumber((liquidity.positionsQuery.data || []).reduce((sum, position) => sum + position.lpAmount, 0), 4),
        detail: `${liquidity.positionsQuery.data?.length || 0} Anchor LP positions`,
      },
      {
        label: "Borrow exposure",
        value: formatNumber(lending.positionQuery.data?.borrowedAmount || 0, 4),
        detail: lending.positionQuery.data
          ? `Health factor ${formatNumber(lending.positionQuery.data.healthFactor, 2)}`
          : "No lending position on-chain",
      },
      {
        label: "Governance activity",
        value: formatNumber(governance.proposalsQuery.data?.length || 0, 0),
        detail: `${(governance.proposalsQuery.data || []).filter((proposal) => proposal.status === "active").length} active proposals`,
      },
    ],
    [
      governance.proposalsQuery.data,
      lending.positionQuery.data,
      liquidity.positionsQuery.data,
      staking.positionsQuery.data,
    ],
  );

  const orbStatus = useMemo<"normal" | "success" | "warning" | "danger">(() => {
    if (sendMutation.isSuccess || airdropMutation.isSuccess || swapMutation.isSuccess || createTokenMutation.isSuccess) {
      return "success";
    }
    if (alerts.some((alert) => alert.severity === "danger")) {
      return "danger";
    }
    if ((walletScoreQuery.data?.score || 0) > 0 && (walletScoreQuery.data?.score || 0) < 70) {
      return "warning";
    }
    return connected ? "normal" : "warning";
  }, [
    airdropMutation.isSuccess,
    alerts,
    connected,
    createTokenMutation.isSuccess,
    sendMutation.isSuccess,
    swapMutation.isSuccess,
    walletScoreQuery.data?.score,
  ]);
  const favoriteWallets = authUser?.linkedWallets?.filter((item) => item.favorite) || [];

  const handleCopyAddress = async () => {
    if (!address) {
      toast.error("No wallet address available");
      return;
    }

    await navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  const handleCopySignature = async (signature: string) => {
    await navigator.clipboard.writeText(signature);
    toast.success("Signature copied");
  };

  const handleSaveAddress = ({
    name,
    address: receiver,
    network: contactNetwork,
  }: {
    name: string;
    address: string;
    network?: string;
  }) => {
    try {
      new PublicKey(receiver);
      createAddressMutation.mutate(
        {
          name,
          walletAddress: receiver,
          network: contactNetwork || "Devnet",
        },
        {
          onSuccess: () => {
            toast.success("Address saved");
          },
          onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Failed to save address");
          },
        },
      );
    } catch {
      toast.error("Enter a valid address before saving");
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportTransactions = () => {
    const rows = [
      ["type", "token", "amount", "status", "signature", "createdAt"],
      ...transactions.map((transaction) => [
        transaction.type,
        transaction.token,
        `${transaction.amount}`,
        transaction.status,
        transaction.signature || "",
        transaction.createdAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "retix-wallet-transactions.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Transaction history exported");
  };

  return (
    <div className="relative isolate space-y-8 pb-24 md:space-y-10 md:pb-8">
      <WalletUltraBackground className="-inset-x-6 -top-8 h-[52rem]" />

      <PageHeader
        title="Retix Wallet Ultra"
        subtitle="A futuristic Solana control center with live network visuals, terminal tools, wallet intelligence, and premium execution UX."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Connected Wallet</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.68)]" />
                {connected ? `${providerName || "Retix Wallet"} ${shortenAddress(address)}` : "Not connected"}
              </div>
            </div>
            <Button variant="secondary" onClick={() => setTerminalOpen(true)}>
              <TerminalSquare className="h-4 w-4" />
              Terminal
            </Button>
            <Button onClick={openConnectModal}>
              <Wallet className="h-4 w-4" />
              {connected ? "Switch Wallet" : "Connect Wallet"}
            </Button>
          </div>
        }
      />

      <WalletHeroCard
        connected={connected}
        address={address}
        providerName={providerName}
        network={network}
        balanceSol={balanceQuery.data?.balanceSol || 0}
        usdEstimate={balanceQuery.data?.usdEstimate || 0}
        portfolioChange={portfolioChange}
        history={balanceHistory}
        latencyMs={latencyMs}
        estimatedFee={DEFAULT_SOL_FEE}
        transactionSpeed={transactionSpeed}
        networkHealth={gasOptimizationQuery.data?.networkHealth || "Network health nominal"}
        riskLabel={walletScoreQuery.data?.riskLevel}
        orbStatus={orbStatus}
        onCopyAddress={handleCopyAddress}
        onSend={() => scrollTo("wallet-send-panel")}
        onReceive={() => setReceiveModalOpen(true)}
        onSwap={() => scrollTo("wallet-swap-panel")}
        onBuy={() => toast.info("Buy flow is planned for a later Retix Wallet release")}
        onAirdrop={() => airdropMutation.mutate()}
        onTerminal={() => setTerminalOpen(true)}
      />

      <WalletTicker transactions={transactions} />

      <div className="grid gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <SectionCard
            title="Protocol-linked on-chain state"
            description="Retix Wallet reads staking, liquidity, lending, and governance accounts directly from the deployed Anchor programs so wallet balances and protocol exposure can be verified independently."
          >
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {protocolTiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{tile.label}</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{tile.value}</div>
                  <div className="mt-2 text-sm text-slate-400">{tile.detail}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {protocolStatuses.map((status) => (
                <div
                  key={status.programId}
                  className="rounded-xl border border-cyan-400/12 bg-cyan-400/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-200">
                        <Blocks className="h-4 w-4" />
                        {status.label}
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {status.deployed ? "Verified on Devnet" : "Waiting for deploy"}
                      </div>
                      <div className="mt-2 font-mono text-xs text-slate-500">{status.programId}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(status.explorerUrl, "_blank", "noopener,noreferrer")}
                    >
                      View
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <WalletAnalyticsCharts
            allocation={portfolioQuery.data?.allocation || []}
            history={balanceHistory}
            insights={insightsQuery.data}
            loading={Boolean((portfolioQuery.isLoading || insightsQuery.isLoading) && connected)}
          />

          <AssetTable tokens={portfolioTokens} onSelectToken={(token) => setSelectedToken(token)} />
        </div>

        <div className="space-y-6 xl:col-span-4">
          <SecurityHudCard
            score={walletScoreQuery.data}
            optimization={gasOptimizationQuery.data}
            alerts={alerts}
          />
          <NetworkHealthPanel
            latencyMs={latencyMs}
            feeEstimate={DEFAULT_SOL_FEE}
            networkHealth={gasOptimizationQuery.data?.networkHealth || "Network telemetry nominal"}
            transactionSpeed={transactionSpeed}
            congestionLevel={gasOptimizationQuery.data?.congestionLevel}
          />
          <WalletRiskCard score={walletScoreQuery.data} loading={walletScoreQuery.isLoading && connected} />
          <AIAdvisorPanel advice={portfolioAdviceQuery.data} loading={portfolioAdviceQuery.isLoading && connected} />
          <SecurityAlertPanel alerts={alerts} loading={alertsQuery.isLoading && connected} />
          <WalletInsights
            insights={insightsQuery.data}
            transactions={transactions}
            loading={insightsQuery.isLoading && connected}
          />
        </div>

        <div className="space-y-6 xl:col-span-7">
          <div className="grid gap-6 2xl:grid-cols-[1.06fr_0.94fr]">
            <WalletOverviewCard
              availableBalance={Math.max(0, (balanceQuery.data?.balanceSol || 0) - lockedBalance)}
              lockedBalance={lockedBalance}
              usdEstimate={balanceQuery.data?.usdEstimate || 0}
              estimatedFee={DEFAULT_SOL_FEE}
              activityLabel={activityLabel}
              walletAgeLabel={walletAgeLabel}
              providerName={providerName || "Retix Wallet"}
              network={network}
              history={balanceHistory}
            />
            <TransactionStatusCard state={executionState} onCopySignature={handleCopySignature} />
          </div>

          <div id="wallet-send-panel">
            <SendPanel
              connected={connected}
              balanceSol={balanceQuery.data?.balanceSol || 0}
              loading={sendMutation.isPending}
              addressBook={addressBook}
              prefillReceiver={prefillReceiver}
              walletAddress={address}
              onDraftChange={setTransferDraft}
              onPreviewStateChange={setFlowPreviewState}
              onSend={async (values) => {
                await sendMutation.mutateAsync(values);
                setPrefillReceiver(null);
              }}
              onSaveAddress={handleSaveAddress}
              onUseSavedAddress={() => undefined}
            />
          </div>

          <TransactionFlowVisualizer
            walletAddress={address}
            receiver={transferDraft.receiver || prefillReceiver}
            amount={transferDraft.amount}
            estimatedFee={transferDraft.fee}
            valid={transferDraft.valid}
            status={executionState?.status || null}
            previewState={flowPreviewState}
          />

          <div id="wallet-swap-panel">
            <SwapPanel
              connected={connected}
              tokens={portfolioTokens}
              preview={swapPreviewQuery.data}
              previewLoading={swapPreviewQuery.isFetching}
              loading={swapMutation.isPending}
              onPreview={(values) => setSwapDraft(values)}
              onSwap={async (values) => {
                await swapMutation.mutateAsync(values);
              }}
            />
          </div>

          <CreateTokenPanel
            connected={connected}
            loading={createTokenMutation.isPending}
            result={createdTokenResult || undefined}
            onCopyMint={async () => {
              if (!createdTokenResult?.mintAddress) {
                return;
              }

              await navigator.clipboard.writeText(createdTokenResult.mintAddress);
              toast.success("Mint address copied");
            }}
            onCreate={async (values) => {
              await createTokenMutation.mutateAsync(values);
            }}
          />

          <RecentTransactionsPanel transactions={transactions} loading={transactionsQuery.isLoading && connected} />
        </div>

        <div className="space-y-6 xl:col-span-5">
          <AddressInteractionRadar
            walletAddress={address}
            entries={addressBook}
            transactions={transactions}
            isLive={connected}
          />
          <WalletActivityTimeline transactions={transactions} />
          <SectionCard
            title="Favorite Wallets"
            description="Pinned wallets and operator notes for quick switching between treasury, trading, and personal contexts."
          >
            {favoriteWallets.length > 0 ? (
              <div className="space-y-3">
                {favoriteWallets.map((walletEntry) => (
                  <div key={walletEntry.address} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-white">
                          <Star className="h-4 w-4 fill-current text-amber-300" />
                          <span className="font-semibold">{walletEntry.label || shortenAddress(walletEntry.address)}</span>
                        </div>
                        <div className="mt-2 text-sm text-slate-400">{walletEntry.address}</div>
                        {walletEntry.notes ? <div className="mt-2 text-sm text-slate-300">{walletEntry.notes}</div> : null}
                      </div>
                      {walletEntry.isPrimary ? (
                        <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                          Primary
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
                No favorite wallets saved yet. Use Settings to save wallet notes and pin operator wallets for fast switching.
              </div>
            )}
          </SectionCard>
          <AddressBookCard
            entries={addressBook}
            onAdd={handleSaveAddress}
            onEdit={(id, payload) => {
              try {
                new PublicKey(payload.address);
                updateAddressMutation.mutate(
                  {
                    id,
                    payload: {
                      name: payload.name,
                      walletAddress: payload.address,
                      network: payload.network,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("Contact updated");
                    },
                    onError: (error: unknown) => {
                      toast.error(error instanceof Error ? error.message : "Failed to update contact");
                    },
                  },
                );
              } catch {
                toast.error("Enter a valid address");
              }
            }}
            onDelete={(id) => {
              deleteAddressMutation.mutate(id, {
                onSuccess: () => {
                  toast.success("Contact removed");
                },
                onError: (error: unknown) => {
                  toast.error(error instanceof Error ? error.message : "Failed to remove contact");
                },
              });
            }}
            onQuickSend={(entry: AddressBookEntry) => {
              setPrefillReceiver(entry.address);
              scrollTo("wallet-send-panel");
            }}
          />
          <NFTGalleryCard nfts={nftQuery.data || []} loading={nftQuery.isLoading && connected} />
        </div>

        <div className="grid gap-6 xl:col-span-12 xl:grid-cols-3">
          <GasOptimizerWidget
            optimization={gasOptimizationQuery.data}
            loading={gasOptimizationQuery.isLoading && connected}
          />
          <WhySolanaPanel />
          <BlockchainTransparencyPanel address={address} />
        </div>

        <div className="xl:col-span-12">
          <SectionCard
            title="Explorer Verification Center"
            description="Public verification shortcuts for wallet address, latest signatures, token mints, and deployed protocol programs."
            action={
              <Button variant="secondary" onClick={exportTransactions}>
                <FileDown className="h-4 w-4" />
                Export Transactions
              </Button>
            }
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Wallet address",
                  value: address || "Unavailable",
                  href: address ? `https://explorer.solana.com/address/${address}?cluster=devnet` : null,
                },
                {
                  label: "Latest transaction",
                  value: transactions[0]?.signature || "No signature yet",
                  href: transactions[0]?.signature ? `https://explorer.solana.com/tx/${transactions[0].signature}?cluster=devnet` : null,
                },
                {
                  label: "Latest mint",
                  value: createdTokenResult?.mintAddress || "No token minted yet",
                  href: createdTokenResult?.mintAddress ? `https://explorer.solana.com/address/${createdTokenResult.mintAddress}?cluster=devnet` : null,
                },
                {
                  label: "Program explorer",
                  value: protocolStatuses[0]?.programId || "Program pending",
                  href: protocolStatuses[0]?.explorerUrl || null,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                  <div className="mt-3 break-all text-sm font-semibold text-white">{item.value}</div>
                  {item.href ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => window.open(item.href!, "_blank", "noopener,noreferrer")}
                    >
                      View on Explorer
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="mt-4 text-sm text-slate-500">Awaiting on-chain activity</div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between gap-2 rounded-xl border border-cyan-400/16 bg-[rgba(7,12,24,0.92)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden">
        <Button className="flex-1" onClick={() => scrollTo("wallet-send-panel")}>
          <Plus className="h-4 w-4" />
          Send
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setReceiveModalOpen(true)}>
          <Wallet className="h-4 w-4" />
          Receive
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => scrollTo("wallet-swap-panel")}>
          <ArrowUpDown className="h-4 w-4" />
          Swap
        </Button>
      </div>

      <ReceiveModal
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        address={address}
        onCopy={handleCopyAddress}
      />

      <WalletTerminalDrawer
        open={terminalOpen}
        onOpenChange={setTerminalOpen}
        address={address}
        balanceSol={balanceQuery.data?.balanceSol || 0}
        tokens={portfolioTokens}
        insights={insightsQuery.data}
        providerName={providerName || "Retix Wallet"}
        riskLevel={walletScoreQuery.data?.riskLevel}
        onAirdrop={() => airdropMutation.mutate()}
      />

      <TokenDetailDrawer
        token={selectedToken}
        open={Boolean(selectedToken)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedToken(null);
          }
        }}
        history={balanceHistory}
        onSend={() => {
          setSelectedToken(null);
          scrollTo("wallet-send-panel");
        }}
        onReceive={() => {
          setSelectedToken(null);
          setReceiveModalOpen(true);
        }}
        onSwap={() => {
          setSelectedToken(null);
          scrollTo("wallet-swap-panel");
        }}
      />
    </div>
  );
}
