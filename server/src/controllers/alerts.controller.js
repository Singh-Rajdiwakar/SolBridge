import { sendSuccess } from "../utils/response.js";
import { createAlert, deleteAlert, listAlerts, updateAlert } from "../services/alert.service.js";
import { alertParamsSchema, alertSchema, alertUpdateSchema } from "../validators/alerts.validators.js";

export async function getAlerts(req, res) {
  return sendSuccess(res, await listAlerts(req.user._id));
}

export async function postAlert(req, res) {
  const payload = alertSchema.parse(req.body);
  return sendSuccess(res, await createAlert(req.user._id, payload), 201);
}

export async function putAlert(req, res) {
  const params = alertParamsSchema.parse(req.params);
  const payload = alertUpdateSchema.parse(req.body);
  return sendSuccess(res, await updateAlert(req.user._id, params.id, payload));
}

export async function destroyAlert(req, res) {
  const params = alertParamsSchema.parse(req.params);
  return sendSuccess(res, await deleteAlert(req.user._id, params.id));
}
