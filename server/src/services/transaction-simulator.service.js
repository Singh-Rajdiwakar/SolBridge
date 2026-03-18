import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { getUserBalance } from "../utils/balances.js";
import { getBalance } from "./solana.service.js";
import { getGasOptimization } from "./gas-optimizer.service.js";
import {
  analyzeTransactionRisk,
  calculateTransactionConfidence,
} from "./security.service.js";
import { previewSwapQuote } from "./swap.service.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function getTrackedSolBalance(user, walletAddress) {
  if (!walletAddress) {
    return getUserBalance(user, "SOL");
  }

  try {
    return (await getBalance(walletAddress)).sol;
  } catch {
    return getUserBalance(user, "SOL");
  }
}

export async function simulateTransaction(userId, payload) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const gas = await getGasOptimization(userId);
  const kind = payload.kind || (payload.fromToken && payload.toToken ? "swap" : "send");

  if (kind === "swap") {
    const quote = previewSwapQuote(payload);
    const successProbability = clamp(
      Math.round(97 - quote.priceImpact * 8 - (payload.slippage || 0) * 2),
      42,
      99,
    );

    return {
      kind,
      expectedResult: {
        fromToken: payload.fromToken,
        toToken: payload.toToken,
        amountIn: payload.amount,
        amountOut: quote.estimatedOutput,
        route: quote.route,
      },
      networkFee: gas.currentFee,
      successProbability,
      priceImpact: quote.priceImpact,
      warnings: quote.priceImpact > 1 ? ["Price impact is elevated for this route."] : [],
      confidenceScore: calculateTransactionConfidence({
        riskScore: Math.round(quote.priceImpact * 10),
        successProbability,
        congestionLevel: gas.congestionLevel,
      }),
      gasOptimization: gas,
    };
  }

  const token = payload.token || "SOL";
  const balanceBefore = token === "SOL" ? await getTrackedSolBalance(user, payload.walletAddress) : getUserBalance(user, token);
  const risk = await analyzeTransactionRisk({
    userId,
    walletAddress: payload.walletAddress,
    receiverAddress: payload.receiverAddress,
    amount: payload.amount,
    token,
    persist: false,
  });

  const warnings = [...risk.warnings];
  if (payload.amount + gas.currentFee > balanceBefore) {
    warnings.push("Tracked balance may be insufficient once fee is included.");
  }
  if (risk.riskLevel === "High Risk") {
    warnings.push("Receiver should be manually verified before signing.");
  }

  let successProbability = 97;
  if (payload.amount + gas.currentFee > balanceBefore) {
    successProbability = 18;
  } else if (risk.riskLevel === "Blocked") {
    successProbability = 4;
  } else if (risk.riskLevel === "High Risk") {
    successProbability = 54;
  } else if (risk.riskLevel === "Suspicious") {
    successProbability = 82;
  }

  const confidenceScore = calculateTransactionConfidence({
    riskScore: risk.riskScore,
    successProbability,
    congestionLevel: gas.congestionLevel,
  });

  return {
    kind,
    expectedResult: {
      youSend: `${payload.amount} ${token}`,
      youReceive: `${payload.amount} ${token}`,
      remainingBalance: Number(Math.max(0, balanceBefore - payload.amount - gas.currentFee).toFixed(6)),
      token,
    },
    networkFee: gas.currentFee,
    successProbability,
    priceImpact: 0,
    warnings,
    riskLevel: risk.riskLevel,
    addressRisk: risk,
    confidenceScore,
    gasOptimization: gas,
    balanceChange: {
      before: Number(balanceBefore.toFixed(6)),
      after: Number(Math.max(0, balanceBefore - payload.amount - gas.currentFee).toFixed(6)),
    },
  };
}
