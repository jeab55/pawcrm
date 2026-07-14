const APP_ID = "app-420a3f";
const DATABASE = "b55_pawcrm";

const entityNames = {
  Appointment: "appointments",
  ClinicSettings: "clinic_settings",
  InsuranceClaim: "insurance_claims",
  InventoryItem: "inventory_items",
  Invoice: "invoices",
  MedicalRecord: "medical_records",
  Owner: "owners",
  Pet: "pets",
  QueueBooking: "queue_bookings",
  Service: "services",
  Staff: "staff",
  User: "users",
  Vaccination: "vaccinations",
  Veterinarian: "veterinarians",
  Visit: "visits",
};

function sdk() {
  if (typeof globalThis.B55?.entity !== "function") {
    throw new Error("ไม่พบ base55sdk.js — กรุณาเปิด PawCRM ผ่าน Base55");
  }
  return globalThis.B55;
}

function normalizeSort(sort) {
  const value = String(sort || "-created_at");
  return value
    .replace("created_date", "created_at")
    .replace("updated_date", "updated_at");
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return row;
  return {
    ...row,
    created_date: row.created_date ?? row.created_at,
    updated_date: row.updated_date ?? row.updated_at,
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  const result = rows.map(normalizeRow);
  if (rows.total !== undefined) result.total = rows.total;
  return result;
}

function makeEntity(name) {
  const api = () => sdk().entity(entityNames[name] || name);
  return {
    async list(sort, limit = 200) {
      return normalizeRows(await api().list({ sort: normalizeSort(sort), limit }));
    },
    async filter(where = {}, sort, limit = 200) {
      return normalizeRows(await api().filter(where, { sort: normalizeSort(sort), limit }));
    },
    async get(id) {
      return normalizeRow(await api().get(id));
    },
    async create(data) {
      return normalizeRow(await api().create(data));
    },
    async update(id, data) {
      return normalizeRow(await api().update(id, data));
    },
    async delete(id) {
      return api().remove(id);
    },
    subscribe(callback) {
      const timer = globalThis.setInterval(() => callback({ type: "poll" }), 10000);
      return () => globalThis.clearInterval(timer);
    },
  };
}

export function createBase55Client(fallback) {
  sdk().init({ app: APP_ID, database: DATABASE });

  const entities = new Proxy({}, {
    get(_target, name) {
      return makeEntity(name);
    },
  });

  const auth = {
    me: () => sdk().auth.me(),
    logout: () => sdk().auth.logout(),
    redirectToLogin: () => { globalThis.location.href = "https://base55.thinkpowers.site/"; },
    ...fallback.auth,
  };
  // Ensure the Base55 implementations are not overwritten by the fallback SDK.
  auth.me = () => sdk().auth.me();
  auth.logout = () => sdk().auth.logout();
  auth.redirectToLogin = () => { globalThis.location.href = "https://base55.thinkpowers.site/"; };

  return { ...fallback, auth, entities };
}
