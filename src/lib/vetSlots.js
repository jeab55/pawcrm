import moment from "moment";

// Clinic operating hours & slot granularity
export const SLOT_START = "09:00";
export const SLOT_END = "18:00"; // slots generated up to (but not including) this time
export const SLOT_STEP = 30; // minutes

// Generate the list of clinic time slots, e.g. ["09:00", "09:30", ... "17:30"]
export function generateSlots() {
  const slots = [];
  const start = moment(SLOT_START, "HH:mm");
  const end = moment(SLOT_END, "HH:mm");
  const cur = start.clone();
  while (cur.isBefore(end)) {
    slots.push(cur.format("HH:mm"));
    cur.add(SLOT_STEP, "minutes");
  }
  return slots;
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Does [aStart, aStart+aDur) overlap [bStart, bStart+bDur) ?
function overlaps(aStart, aDur, bStart, bDur) {
  const aEnd = aStart + (aDur || SLOT_STEP);
  const bEnd = bStart + (bDur || SLOT_STEP);
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Build a set of busy intervals for a vet on a given date, merged from
 * QueueBookings, Appointments and Visits (visits count for today only).
 * Each item: { start (minutes), duration, label }
 */
export function buildBusyIntervals({ vetId, date, bookings = [], appointments = [], visits = [], excludeBookingId }) {
  const intervals = [];

  bookings.forEach((b) => {
    if (b.id === excludeBookingId) return;
    if (b.veterinarian_id !== vetId) return;
    if (b.booking_date !== date) return;
    if (b.status === "Cancelled" || b.status === "No Show") return;
    const start = toMinutes(b.booking_time);
    if (start == null) return;
    intervals.push({ start, duration: b.duration_minutes || SLOT_STEP, label: `${b.pet_name} · ${b.service_type}` });
  });

  appointments.forEach((a) => {
    if (a.vet_id !== vetId) return;
    if (a.date !== date) return;
    if (a.status === "Cancelled" || a.status === "No-show") return;
    const start = toMinutes(a.time_slot);
    if (start == null) return;
    const end = toMinutes(a.end_time);
    const duration = end != null && end > start ? end - start : SLOT_STEP;
    intervals.push({ start, duration, label: `${a.pet_name || "นัดหมาย"} · ${a.type || ""}` });
  });

  const today = moment().format("YYYY-MM-DD");
  if (date === today) {
    visits.forEach((v) => {
      if (v.vet_id !== vetId) return;
      if (v.status === "Completed" || v.status === "Cancelled") return;
      const t = v.check_in_time ? moment(v.check_in_time) : moment(v.created_date);
      if (!t.isValid() || t.format("YYYY-MM-DD") !== date) return;
      intervals.push({ start: t.hours() * 60 + t.minutes(), duration: SLOT_STEP, label: `${v.pet_name} · กำลังตรวจ` });
    });
  }

  return intervals;
}

// Return { time -> busyLabel|null } for each slot given busy intervals & a duration.
export function computeSlotAvailability(busyIntervals, durationMinutes = SLOT_STEP) {
  const slots = generateSlots();
  const map = {};
  slots.forEach((s) => {
    const start = toMinutes(s);
    const clash = busyIntervals.find((iv) => overlaps(start, durationMinutes, iv.start, iv.duration));
    map[s] = clash ? clash.label : null;
  });
  return map;
}

// True if the chosen time clashes with any busy interval for that vet.
export function hasConflict(busyIntervals, time, durationMinutes = SLOT_STEP) {
  const start = toMinutes(time);
  if (start == null) return false;
  return busyIntervals.some((iv) => overlaps(start, durationMinutes, iv.start, iv.duration));
}