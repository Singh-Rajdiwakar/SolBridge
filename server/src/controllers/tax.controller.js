import { sendSuccess } from "../utils/response.js";
import {
  exportTaxReport,
  getCapitalGainsReport,
  getLendingIncomeReport,
  getStakingIncomeReport,
  getTaxSummary,
  getYearlyTaxReport,
} from "../services/tax.service.js";
import {
  taxExportSchema,
  taxGroupPathSchema,
  taxQuerySchema,
  taxWalletPathSchema,
} from "../validators/tax.validators.js";

export async function summary(req, res) {
  const params = taxWalletPathSchema.parse(req.params);
  const query = taxQuerySchema.parse(req.query);
  return sendSuccess(res, await getTaxSummary(req.user._id, { walletAddress: params.walletAddress, ...query }));
}

export async function capitalGains(req, res) {
  const params = taxWalletPathSchema.parse(req.params);
  const query = taxQuerySchema.parse(req.query);
  return sendSuccess(res, await getCapitalGainsReport(req.user._id, { walletAddress: params.walletAddress, ...query }));
}

export async function stakingIncome(req, res) {
  const params = taxWalletPathSchema.parse(req.params);
  const query = taxQuerySchema.parse(req.query);
  return sendSuccess(res, await getStakingIncomeReport(req.user._id, { walletAddress: params.walletAddress, ...query }));
}

export async function lendingIncome(req, res) {
  const params = taxWalletPathSchema.parse(req.params);
  const query = taxQuerySchema.parse(req.query);
  return sendSuccess(res, await getLendingIncomeReport(req.user._id, { walletAddress: params.walletAddress, ...query }));
}

export async function yearlyReport(req, res) {
  const params = taxWalletPathSchema.parse(req.params);
  const query = taxQuerySchema.parse(req.query);
  return sendSuccess(res, await getYearlyTaxReport(req.user._id, { walletAddress: params.walletAddress, ...query }));
}

export async function yearlyGroupReport(req, res) {
  const params = taxGroupPathSchema.parse(req.params);
  const query = taxQuerySchema.parse(req.query);
  return sendSuccess(res, await getYearlyTaxReport(req.user._id, { groupId: params.groupId, ...query }));
}

export async function exportJson(req, res) {
  const payload = taxExportSchema.parse(req.body);
  return sendSuccess(res, await exportTaxReport(req.user._id, { ...payload, format: "json" }));
}

export async function exportCsv(req, res) {
  const payload = taxExportSchema.parse(req.body);
  return sendSuccess(res, await exportTaxReport(req.user._id, { ...payload, format: "csv" }));
}

export async function exportPdf(req, res) {
  const payload = taxExportSchema.parse(req.body);
  return sendSuccess(res, await exportTaxReport(req.user._id, { ...payload, format: "pdf" }));
}
