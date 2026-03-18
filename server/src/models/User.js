import mongoose from "mongoose";

const balanceSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    amount: { type: Number, default: 0 },
    fiatValue: { type: Number, default: 0 },
  },
  { _id: false },
);

const linkedWalletSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    provider: { type: String, default: "retix" },
    label: { type: String, default: "" },
    notes: { type: String, default: "" },
    favorite: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const preferencesSchema = new mongoose.Schema(
  {
    favoriteCoins: { type: [String], default: ["BTC", "ETH", "SOL"] },
    chartTimeframe: { type: String, default: "7D" },
    selectedCurrency: { type: String, default: "usd" },
    sidebarCollapsed: { type: Boolean, default: false },
    themeMode: { type: String, default: "dark" },
    defaultDashboardTab: { type: String, default: "wallet" },
    marketView: { type: String, default: "overview" },
    watchlistLayout: { type: String, default: "grid" },
    autoRefreshEnabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    walletAddress: { type: String, required: true },
    avatar: { type: String, default: "" },
    balances: { type: [balanceSchema], default: [] },
    linkedWallets: { type: [linkedWalletSchema], default: [] },
    preferredNetwork: { type: String, default: "devnet" },
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

userSchema.index({ "linkedWallets.address": 1 });
export const User = mongoose.models.User || mongoose.model("User", userSchema);
