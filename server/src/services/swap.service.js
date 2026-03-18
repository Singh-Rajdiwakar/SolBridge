import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { adjustUserBalance, getUserBalance } from "../utils/balances.js";
import { getTokenPrice } from "../utils/tokens.js";
import { getGasOptimization } from "./gas-optimizer.service.js";
import { calculateTransactionConfidence } from "./security.service.js";
import { createTransactionRecord } from "./transaction.service.js";
import { logger } from "../utils/logger.js";

function buildSwapQuote(fromToken, toToken, amount, slippage = 0.5) {
  const fromPrice = getTokenPrice(fromToken);
  const toPrice = getTokenPrice(toToken);

  if (!fromPrice || !toPrice) {
    throw new AppError("Unsupported token pair for swap", 400);
  }

  const executionPrice = fromPrice / toPrice;
  const priceImpact = Number((0.12 + Math.min(amount / 5000, 0.75)).toFixed(2));
  const fee = 0.000005;
  const estimatedOutput = Number(
    (amount * executionPrice * (1 - slippage / 100) * (1 - priceImpact / 100)).toFixed(
      toToken === "BONK" ? 0 : 6,
    ),
  );

  return {
    fromToken,
    toToken,
    amount,
    price: Number(executionPrice.toFixed(6)),
    estimatedOutput,
    fee,
    priceImpact,
    slippage,
    route: `${fromToken} > ${toToken}`,
  };
}

export function previewSwapQuote(payload) {
  return buildSwapQuote(payload.fromToken, payload.toToken, payload.amount, payload.slippage);
}

export async function executeSimulatedSwap({ userId, address, provider, ...payload }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const gasOptimization = await getGasOptimization(userId);
  const quote = buildSwapQuote(payload.fromToken, payload.toToken, payload.amount, payload.slippage);
  const available = getUserBalance(user, payload.fromToken);
  if (available < payload.amount) {
    throw new AppError(`Insufficient ${payload.fromToken} balance for this swap`, 400);
  }

  adjustUserBalance(user, payload.fromToken, -payload.amount);
  adjustUserBalance(user, payload.toToken, quote.estimatedOutput);
  await user.save();

  const confidenceScore = calculateTransactionConfidence({
    riskScore: Math.round(quote.priceImpact * 10),
    successProbability: 96,
    congestionLevel: gasOptimization.congestionLevel,
  });

  const transaction = await createTransactionRecord({
    userId,
    type: "Swap",
    token: payload.toToken,
    amount: quote.estimatedOutput,
    receiver: address,
    status: "completed",
    network: "Devnet",
    metadata: {
      walletAddress: address,
      provider,
      walletModule: true,
      simulated: true,
      fromToken: payload.fromToken,
      toToken: payload.toToken,
      amountIn: payload.amount,
      amountOut: quote.estimatedOutput,
      executionPrice: quote.price,
      slippage: quote.slippage,
      priceImpact: quote.priceImpact,
      networkFee: quote.fee,
      route: quote.route,
      confidenceScore,
      riskLevel: quote.priceImpact > 1 ? "Suspicious" : "Safe",
    },
  });

  logger.info("wallet.swap.executed", {
    userId: String(userId),
    address,
    fromToken: payload.fromToken,
    toToken: payload.toToken,
    amount: payload.amount,
    estimatedOutput: quote.estimatedOutput,
  });

  return {
    ...quote,
    confidenceScore,
    transaction,
  };
}
