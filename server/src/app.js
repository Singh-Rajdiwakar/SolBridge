import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/error.js";
import { apiRateLimiter } from "./middlewares/rate-limit.js";
import adminRoutes from "./routes/admin.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import assistantRoutes from "./routes/assistant.routes.js";
import addressBookRoutes from "./routes/address-book.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import crossWalletRoutes from "./routes/cross-wallet.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import explorerRoutes from "./routes/explorer.routes.js";
import gasRoutes from "./routes/gas.routes.js";
import governanceRoutes from "./routes/governance.routes.js";
import lendingRoutes from "./routes/lending.routes.js";
import marketsRoutes from "./routes/markets.routes.js";
import networkRoutes from "./routes/network.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import poolsRoutes from "./routes/pools.routes.js";
import riskRoutes from "./routes/risk.routes.js";
import securityRoutes from "./routes/security.routes.js";
import simulatorRoutes from "./routes/simulator.routes.js";
import socialRoutes from "./routes/social.routes.js";
import stakingRoutes from "./routes/staking.routes.js";
import strategyRoutes from "./routes/strategy.routes.js";
import taxRoutes from "./routes/tax.routes.js";
import tradingRoutes from "./routes/trading.routes.js";
import treasuryRoutes from "./routes/treasury.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import userRoutes from "./routes/user.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

const app = express();
const allowedOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (isLocalhostOrigin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(apiRateLimiter);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/staking", stakingRoutes);
app.use("/api/strategy", strategyRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/cross-wallet", crossWalletRoutes);
app.use("/api/pools", poolsRoutes);
app.use("/api/lending", lendingRoutes);
app.use("/api/governance", governanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/explorer", explorerRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/markets", marketsRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/treasury", treasuryRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/address-book", addressBookRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/gas", gasRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
