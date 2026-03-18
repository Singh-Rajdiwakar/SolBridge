import { AdminLog } from "../models/AdminLog.js";

export async function createAdminLog(payload) {
  const adminUserId = payload.adminUserId || payload.adminId || undefined;
  return AdminLog.create({
    severity: "info",
    module: "admin",
    ...("adminId" in payload ? {} : { adminId: adminUserId }),
    adminUserId,
    ...payload,
  });
}
