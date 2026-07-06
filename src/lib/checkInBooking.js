import { base44 } from "@/api/base44Client";
import moment from "moment";

// Creates a Visit from a booking and marks the booking Checked In.
// todayVisits: array of today's visits used to compute the next queue number.
export async function checkInBooking(booking, todayVisits) {
  const maxQueue = (todayVisits || []).reduce((max, v) => Math.max(max, v.queue_number || 0), 0);

  const visit = await base44.entities.Visit.create({
    queue_number: maxQueue + 1,
    pet_id: booking.pet_id || undefined,
    pet_name: booking.pet_name,
    owner_name: booking.owner_name,
    owner_phone: booking.owner_phone,
    species: booking.species || undefined,
    status: "Waiting",
    check_in_time: new Date().toISOString(),
    vet_id: booking.veterinarian_id || undefined,
    vet_name: booking.veterinarian_name || undefined,
    reason: booking.symptoms_or_note || undefined,
    has_meds: false,
    dispensed: false,
  });

  await base44.entities.QueueBooking.update(booking.id, {
    status: "Checked In",
    visit_id: visit.id,
  });

  return visit;
}

export function todayVisitsFilter(all) {
  const today = moment().format("YYYY-MM-DD");
  return all.filter((v) => moment(v.created_date).format("YYYY-MM-DD") === today);
}