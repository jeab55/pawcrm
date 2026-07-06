// Shared staff role config + per-station selector helpers.
// Selected staff is stored in localStorage keyed by station so each browser/tab
// at a different workstation can pick its own person — never on the user profile.

export const STAFF_ROLES = {
  admin: { label: "แอดมิน", color: "indigo" },
  counter: { label: "เคาน์เตอร์", color: "green" },
  veterinarian: { label: "สัตวแพทย์", color: "teal" },
  assistant: { label: "ผู้ช่วยสัตวแพทย์", color: "blue" },
  pharmacy: { label: "ห้องยา", color: "purple" },
  cashier: { label: "แคชเชียร์", color: "orange" },
};

export const ROLE_LIST = Object.keys(STAFF_ROLES);

// Tailwind classes per color (literal strings so they survive purge)
export const COLOR_CLASSES = {
  green: "bg-green-100 text-green-700 border-green-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  red: "bg-red-100 text-red-700 border-red-200",
};

export const roleLabel = (role) => STAFF_ROLES[role]?.label || role;
export const colorClass = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.green;

// localStorage key per station
const storageKey = (station) => `pawcrm.station.${station}`;

export function getStoredStaff(station) {
  try {
    const raw = localStorage.getItem(storageKey(station));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeStaff(station, staff) {
  try {
    if (staff) localStorage.setItem(storageKey(station), JSON.stringify(staff));
    else localStorage.removeItem(storageKey(station));
  } catch {
    // ignore storage errors
  }
}