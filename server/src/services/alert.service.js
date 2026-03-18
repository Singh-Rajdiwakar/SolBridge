import { Alert } from "../models/Alert.js";
import { AppError } from "../utils/app-error.js";

export async function listAlerts(userId) {
  return Alert.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function createAlert(userId, payload) {
  return Alert.create({
    userId,
    ...payload,
  });
}

export async function updateAlert(userId, id, payload) {
  const alert = await Alert.findOneAndUpdate(
    { _id: id, userId },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  return alert;
}

export async function deleteAlert(userId, id) {
  const alert = await Alert.findOneAndDelete({ _id: id, userId });
  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  return {
    id,
    deleted: true,
  };
}
