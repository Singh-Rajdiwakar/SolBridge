import { Transaction } from "../models/Transaction.js";

const BASE_FEE = 0.000005;

export async function getGasOptimization(userId) {
  const now = new Date();
  const minuteOfHour = now.getUTCMinutes();
  const activityWindow = new Date(Date.now() - 1000 * 60 * 60 * 6);
  const recentTransactions = await Transaction.countDocuments({
    userId,
    createdAt: { $gte: activityWindow },
  });

  const cyclicalLoad = (Math.sin((minuteOfHour / 60) * Math.PI * 2) + 1) / 2;
  const userLoad = Math.min(1, recentTransactions / 18);
  const congestionScore = Number((0.38 + cyclicalLoad * 0.36 + userLoad * 0.26).toFixed(2));

  let congestionLevel = "Low";
  let waitTimeMinutes = 1;
  if (congestionScore >= 0.72) {
    congestionLevel = "High";
    waitTimeMinutes = 4;
  } else if (congestionScore >= 0.48) {
    congestionLevel = "Moderate";
    waitTimeMinutes = 2;
  }

  const currentFee = Number((BASE_FEE * (1 + congestionScore * 1.9)).toFixed(6));
  const reductionFactor =
    congestionLevel === "High" ? 0.62 : congestionLevel === "Moderate" ? 0.78 : 0.92;
  const recommendedFee = Number((currentFee * reductionFactor).toFixed(6));
  const estimatedSavings = Number(
    (((currentFee - recommendedFee) / currentFee) * 100).toFixed(1),
  );
  const estimatedConfirmationTime =
    congestionLevel === "High" ? "35-55 sec" : congestionLevel === "Moderate" ? "18-28 sec" : "8-15 sec";

  return {
    currentFee,
    recommendedFee,
    congestionLevel,
    estimatedSavings,
    estimatedConfirmationTime,
    waitTimeMinutes,
    recommendation:
      estimatedSavings > 10
        ? `Wait ${waitTimeMinutes} minute${waitTimeMinutes > 1 ? "s" : ""} to reduce fee pressure by ${estimatedSavings}%`
        : "Fee conditions are already efficient. Sending now is reasonable.",
    networkHealth: congestionLevel === "High" ? "Busy" : congestionLevel === "Moderate" ? "Stable" : "Healthy",
  };
}
