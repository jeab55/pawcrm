const DATABASE = "b55_pawcrm";
const USER = "@USER_EMAIL@";

const tableNames = {
  Owner: "owners",
  Pet: "pets",
  Visit: "visits",
};

const fieldNames = {
  Owner: ["name", "phone", "email", "address", "photo_url", "id_card", "notes", "status"],
  Pet: [
    "name", "species", "breed", "gender", "date_of_birth", "weight", "color",
    "microchip_id", "owner_id", "owner_name", "owner_phone", "owner_email",
    "owner_address", "photo_url", "notes", "status", "allergies",
  ],
  Visit: [
    "queue_number", "pet_id", "pet_name", "owner_name", "owner_phone", "species",
    "status", "check_in_time", "exam_start_time", "completed_time", "vet_name",
    "vet_id", "reason", "diagnosis", "treatment", "prescriptions", "has_meds",
    "dispensed", "notes", "checked_in_by", "assistant_name", "prepared_by", "dispensed_by",
  ],
};

function getDb() {
  const db = globalThis.B55AI?.db;
  if (typeof db !== "function") {
    throw new Error("ไม่พบ B55AI.db — กรุณาเปิดแอปผ่าน Base55");
  }
  return db;
}

function normalizeRows(result) {
  const candidates = [result?.rows, result?.data?.rows, result?.data, result?.result, result];
  const rows = candidates.find(Array.isArray);
  return rows ?? [];
}

async function query(sql, params = []) {
  const result = await getDb()(DATABASE, sql, params);
  if (result?.ok === false) throw new Error(result.error || result.message || "Base55 database error");
  return result;
}

function safeFields(entity, values) {
  const allowed = new Set(fieldNames[entity]);
  return Object.entries(values)
    .filter(([key, value]) => allowed.has(key) && value !== undefined)
    .map(([key, value]) => [key, typeof value === "object" && value !== null ? JSON.stringify(value) : value]);
}

function sortClause(sort = "-created_date") {
  const descending = String(sort).startsWith("-");
  const requested = String(sort).replace(/^-/, "");
  const column = requested === "created_date" ? "created_at" : requested === "updated_date" ? "updated_at" : "created_at";
  return ` ORDER BY ${column} ${descending ? "DESC" : "ASC"}`;
}

function entityApi(entity) {
  const table = tableNames[entity];
  return {
    async list(sort, limit = 200) {
      const result = await query(
        `SELECT * FROM ${table} WHERE user_email = ?${sortClause(sort)} LIMIT ?`,
        [USER, Number(limit)]
      );
      return normalizeRows(result);
    },

    async filter(filters = {}, sort, limit = 200) {
      const allowed = new Set(fieldNames[entity]);
      const entries = Object.entries(filters).filter(([key]) => allowed.has(key));
      const where = ["user_email = ?", ...entries.map(([key]) => `${key} = ?`)].join(" AND ");
      const params = [USER, ...entries.map(([, value]) => value), Number(limit)];
      const result = await query(`SELECT * FROM ${table} WHERE ${where}${sortClause(sort)} LIMIT ?`, params);
      return normalizeRows(result);
    },

    async get(id) {
      const result = await query(`SELECT * FROM ${table} WHERE id = ? AND user_email = ? LIMIT 1`, [id, USER]);
      return normalizeRows(result)[0] ?? null;
    },

    async create(values) {
      const fields = safeFields(entity, values);
      if (!fields.length) throw new Error(`ไม่มีข้อมูลสำหรับสร้าง ${entity}`);
      const columns = [...fields.map(([key]) => key), "user_email"];
      const params = [...fields.map(([, value]) => value), USER];
      const result = await query(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        params
      );
      const id = result?.insertId ?? result?.data?.insertId;
      return id ? this.get(id) : { id, ...values };
    },

    async update(id, values) {
      const fields = safeFields(entity, values);
      if (!fields.length) return this.get(id);
      await query(
        `UPDATE ${table} SET ${fields.map(([key]) => `${key} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_email = ?`,
        [...fields.map(([, value]) => value), id, USER]
      );
      return this.get(id);
    },

    async delete(id) {
      await query(`DELETE FROM ${table} WHERE id = ? AND user_email = ?`, [id, USER]);
      return { id };
    },

    subscribe(callback) {
      const timer = globalThis.setInterval(callback, 15000);
      return () => globalThis.clearInterval(timer);
    },
  };
}

export function createBase55Client(fallback) {
  const entities = new Proxy({}, {
    get(_target, entity) {
      return tableNames[entity] ? entityApi(entity) : fallback.entities[entity];
    },
  });
  return { ...fallback, entities };
}
