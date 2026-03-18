import {
  createAddressBookEntry,
  deleteAddressBookEntry,
  listAddressBookEntries,
  updateAddressBookEntry,
} from "../services/address-book.service.js";
import { sendSuccess } from "../utils/response.js";
import {
  addressBookCreateSchema,
  addressBookUpdateSchema,
} from "../validators/address-book.validators.js";

function mapAddressBookEntry(entry) {
  const record = entry.toObject ? entry.toObject() : entry;
  return {
    id: String(record._id),
    name: record.name,
    address: record.walletAddress,
    network: record.network,
    notes: record.notes,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
  };
}

export async function list(req, res) {
  const entries = await listAddressBookEntries(req.user._id);
  return sendSuccess(res, entries.map(mapAddressBookEntry));
}

export async function create(req, res) {
  const payload = addressBookCreateSchema.parse(req.body);
  const entry = await createAddressBookEntry(req.user._id, payload);
  return sendSuccess(res, mapAddressBookEntry(entry), 201);
}

export async function update(req, res) {
  const payload = addressBookUpdateSchema.parse(req.body);
  const entry = await updateAddressBookEntry(req.user._id, req.params.id, payload);
  return sendSuccess(res, mapAddressBookEntry(entry));
}

export async function destroy(req, res) {
  const entry = await deleteAddressBookEntry(req.user._id, req.params.id);
  return sendSuccess(res, mapAddressBookEntry(entry));
}
