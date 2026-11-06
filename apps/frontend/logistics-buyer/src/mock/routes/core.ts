// Core mock endpoints: auth (OTP + refresh), buyer, buyer settings, addresses, generic file upload.
//
// Demo login rules (so every Login/OTP/Register error branch can be exercised):
//   9000000000 → /buyer/verify 404 "User with this mobile number not found"
//   9111111111 → /otp/send HTTP 503 { error: { message: "OTP service unavailable" } }
//   9222222222 → /otp/send 200 { data: { success: false, message: "Too many requests" } } (UI shows generic text)
//   any other valid number → OTP sent; the OTP is the "Mock OTP" in the mock controls panel (default 123456)
import { db, nowIso, persist, uuid } from '../db';
import { getControls } from '../controls';
import { MockError, RawResponse, route, setTokenValidator } from '../server';
import type { DbAddress } from '../types';

const AUTH = 'logistics-auth-svc';
const BUYER = 'logistics-buyer-svc';
const FILES = 'files';

function authState(): { token: string; refreshToken: string } {
  const d = db();
  if (!d.ext.auth) d.ext.auth = { token: '', refreshToken: '' };
  return d.ext.auth;
}
const newToken = (kind: string) => `eyJhbGciOiJIUzI1NiJ9.mock-${kind}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

setTokenValidator((t) => {
  const a = authState();
  return !!a.token && t === a.token;
});

/** Used by the mock controls panel. */
export function expireAccessToken() {
  authState().token = 'expired';
  persist();
}
export function revokeSession() {
  const a = authState();
  a.token = 'revoked';
  a.refreshToken = 'revoked';
  persist();
}

// ---------------------------------------------------------------- auth
route('POST', AUTH, '/otp/send', (req) => {
  const phone = String(req.body?.phoneNumber || '');
  if (phone === '9111111111') throw new MockError(503, 'OTP service unavailable', { error: { message: 'OTP service unavailable' } });
  if (phone === '9222222222') return { success: false, message: 'Too many requests' };
  return { success: true, message: 'OTP sent' };
});

route('POST', AUTH, '/otp/verify', (req) => {
  const { phoneNumber, otp } = req.body || {};
  if (String(otp) !== getControls().otp) {
    throw new MockError(400, 'Invalid OTP', { message: 'Invalid OTP', details: 'Request failed with status code 400' });
  }
  const d = db();
  d.buyer.mobileNumber = String(phoneNumber);
  const a = authState();
  a.token = newToken('access');
  a.refreshToken = newToken('refresh');
  persist();
  return {
    success: true,
    verified: true,
    user: {
      id: d.buyer.id,
      name: d.buyer.name,
      email: d.buyer.email,
      mobileNumber: d.buyer.mobileNumber,
      permissions: d.permissions,
      auth: { token: a.token, refreshToken: a.refreshToken },
    },
  };
});

route('POST', AUTH, '/users/refresh_token', (req) => {
  const a = authState();
  if (!req.body?.refreshToken || req.body.refreshToken !== a.refreshToken) throw new MockError(401, 'Invalid refresh token');
  a.token = newToken('access');
  a.refreshToken = newToken('refresh');
  persist();
  return { token: a.token, refreshToken: a.refreshToken };
});

route('GET', AUTH, '/users/:id', () => {
  const d = db();
  const a = authState();
  return { user: { ...d.buyer, permissions: d.permissions, auth: { token: a.token, refreshToken: a.refreshToken } } };
});

// ---------------------------------------------------------------- buyer
route('GET', BUYER, '/buyer/verify/:mobile', (req) => {
  if (req.params.mobile === '9000000000') throw new MockError(404, 'User with this mobile number not found');
  return new RawResponse({ success: true });
});

route('POST', BUYER, '/buyer', (req) => {
  const d = db();
  const b = req.body || {};
  if (b.mobileNumber && b.mobileNumber === d.buyer.mobileNumber) {
    throw new MockError(409, 'Buyer with this mobile number already exists', { message: 'Buyer with this mobile number already exists' });
  }
  d.ext.registrations = [...(d.ext.registrations || []), { ...b, id: uuid(), createdAt: nowIso() }];
  persist();
  return { id: uuid(), ...b };
});

route('GET', BUYER, '/buyer/:id', () => db().buyer);

route('PUT', BUYER, '/buyer', (req) => {
  const d = db();
  Object.assign(d.buyer, req.body?.updateAttributes || {}, { updatedAt: nowIso(), updatedBy: 'buyer' });
  persist();
  return d.buyer;
});

// ---------------------------------------------------------------- buyer settings
function deepMerge(target: any, src: any) {
  if (!src || typeof src !== 'object') return target;
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) target[k] = deepMerge(target[k] && typeof target[k] === 'object' ? { ...target[k] } : {}, v);
    else target[k] = v;
  }
  return target;
}

route('GET', BUYER, '/buyer_settings/:buyerId', () => db().buyerSettings);

/** PATCH merges into buyer_config. */
route('PATCH', BUYER, '/buyer_settings/:buyerId/buyer_config', (req) => {
  const s = db().buyerSettings;
  s.buyer_config = deepMerge({ ...s.buyer_config }, req.body?.buyer_config ?? req.body ?? {});
  s.updated_at = nowIso();
  persist();
  return s;
});

/**
 * POST upserts the FULL document: the buyerConfig / adminConfig it sends REPLACE the stored ones.
 * Every Settings save is a full-document POST (spec 07 §3.6, spec 08 §2.3); replace semantics make the documented
 * edge cases reachable (a save after a failed GET wipes routePlanningConfig/webhookConfig/…; Profile/Store saves
 * reset admin_config to the hard-coded default).
 */
route('POST', BUYER, '/buyer_settings', (req) => {
  const s = db().buyerSettings;
  const b = req.body || {};
  const cfg = b.buyer_config ?? b.buyerConfig;
  if (cfg && typeof cfg === 'object') s.buyer_config = JSON.parse(JSON.stringify(cfg));
  const admin = b.admin_config ?? b.adminConfig;
  if (admin && typeof admin === 'object') s.admin_config = JSON.parse(JSON.stringify(admin));
  s.updated_at = nowIso();
  s.updated_by = 'buyer';
  persist();
  return s;
});

// ---------------------------------------------------------------- addresses
const toAddressRow = (a: DbAddress) => a;

route('GET', BUYER, '/addresses/buyerId/:buyerId/default', () => {
  const a = db().addresses.find((x) => x.is_default);
  if (!a) throw new MockError(404, 'Default address not found');
  return toAddressRow(a);
});

route('GET', BUYER, '/addresses/buyerId/:buyerId', () => db().addresses.map(toAddressRow));

route('POST', BUYER, '/addresses/create', (req) => {
  const d = db();
  const b = req.body || {};
  const row: DbAddress = {
    id: uuid(),
    buyer_id: d.buyer.id,
    address_type: b.addressType ?? b.address_type ?? 'warehouse',
    address_line1: b.addressLine1 ?? b.address_line1 ?? '',
    address_line2: b.addressLine2 ?? b.address_line2 ?? '',
    city: b.city ?? '',
    state: b.state ?? '',
    country: b.country ?? 'India',
    pincode: String(b.pincode ?? ''),
    latitude: b.latitude != null && b.latitude !== '' ? String(b.latitude) : null,
    longitude: b.longitude != null && b.longitude !== '' ? String(b.longitude) : null,
    is_default: !!(b.isDefault ?? b.is_default),
    created_at: nowIso(),
    updated_at: nowIso(),
    created_by: 'buyer',
    updated_by: 'buyer',
    city_code: String(b.cityCode ?? b.city_code ?? ''),
  };
  if (row.is_default) d.addresses.forEach((a) => (a.is_default = false));
  if (!d.addresses.length) row.is_default = true;
  d.addresses.push(row);
  persist();
  return row;
});

route('PUT', BUYER, '/addresses/update', (req) => {
  const d = db();
  const b = req.body || {};
  const id = b.id ?? b.addressId;
  const a = d.addresses.find((x) => x.id === id);
  if (!a) throw new MockError(404, 'Address not found');
  const attrs = b.updateAttributes ?? b;
  const map: Record<string, keyof DbAddress> = { addressLine1: 'address_line1', addressLine2: 'address_line2', addressType: 'address_type', isDefault: 'is_default' };
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'id' || k === 'addressId') return;
    const key = (map[k] ?? k) as keyof DbAddress;
    if (key in a) (a as any)[key] = v;
  });
  if (a.is_default) d.addresses.forEach((x) => x.id !== a.id && (x.is_default = false));
  a.updated_at = nowIso();
  persist();
  return a;
});

function deleteAddress(id: string) {
  const d = db();
  const idx = d.addresses.findIndex((x) => x.id === id);
  if (idx < 0) throw new MockError(404, 'Address not found');
  d.addresses.splice(idx, 1);
  persist();
  return { deleted: true };
}
route('DELETE', BUYER, '/addresses/delete/:id', (req) => deleteAddress(req.params.id));
/** The original AddressService.deleteAddress is `POST /addresses/delete/{id}` with body `{}` (spec 07 §4.6 / §10.2). */
route('POST', BUYER, '/addresses/delete/:id', (req) => deleteAddress(req.params.id));

// ---------------------------------------------------------------- file service (generic upload)
// PUT {fileServicesUrl}/documents/{documentType} — accepts JSON {fileName, fileExtension, fileData(base64)} or FormData.
// Uploaded bytes are kept in memory and served as blob: URLs, so previews/downloads work for this browser session
// (after a reload the URL in stored records no longer resolves — like an expired signed URL).
const MIME: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  csv: 'text/csv', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel',
};
const uploadedBlobs = new Map<string, Blob>();
/** Returns the bytes of a file uploaded in this session (used by mock routes that parse uploads, e.g. order import). */
export function getUploadedBlob(url: string): Blob | undefined {
  return uploadedBlobs.get(url);
}

route('PUT', FILES, '/documents/:type', (req) => {
  const b = req.body || {};
  const name = String(b.fileName || b.file?.name || 'upload');
  const ext = String(b.fileExtension || name.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  let blob: Blob | undefined;
  if (b.file instanceof Blob) blob = b.file;
  else if (b.file?.file instanceof Blob) blob = b.file.file;
  else if (typeof b.fileData === 'string' && b.fileData) {
    try {
      const base64 = b.fileData.includes(',') ? b.fileData.split(',').pop()! : b.fileData;
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      blob = new Blob([bytes], { type: MIME[ext] || 'application/octet-stream' });
    } catch {
      throw new MockError(400, 'Invalid file data');
    }
  }
  const url = blob ? URL.createObjectURL(blob) : `https://files.example.test/${req.params.type}/${Date.now()}-${encodeURIComponent(name)}`;
  if (blob) uploadedBlobs.set(url, blob);
  const d = db();
  d.ext.uploads = [...(d.ext.uploads || []), { type: req.params.type, name, url, at: nowIso(), size: blob?.size ?? 0 }].slice(-50);
  persist();
  return { url, uploadedFiles: [{ url }] };
});
