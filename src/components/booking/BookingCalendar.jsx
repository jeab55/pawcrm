import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Stethoscope, Plus } from "lucide-react";
import moment from "moment";
import { generateSlots, SLOT_STEP } from "@/lib/vetSlots";

const statusConfig = {
  Booked: { label: "จองแล้ว", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  Confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  "Checked In": { label: "เช็คอินแล้ว", color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  Cancelled: { label: "ยกเลิก", color: "bg-gray-100 text-gray-400 border-gray-200", dot: "bg-gray-300" },
  "No Show": { label: "ไม่มาตามนัด", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-400" },
};

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

const NO_VET = "__none__";

export default function BookingCalendar({ bookings, vets, onCreateSlot }) {
  const [view, setView] = useState("day"); // "day" | "week"
  const [cursor, setCursor] = useState(moment().format("YYYY-MM-DD"));

  const slots = generateSlots();

  // Columns: active vets + an "unassigned" column
  const columns = useMemo(() => {
    const cols = vets.map((v) => ({ id: v.id, name: v.name }));
    cols.push({ id: NO_VET, name: "ไม่ระบุหมอ" });
    return cols;
  }, [vets]);

  const goToday = () => setCursor(moment().format("YYYY-MM-DD"));
  const step = (dir) => setCursor(moment(cursor).add(dir * (view === "week" ? 7 : 1), "days").format("YYYY-MM-DD"));

  // bookings for a specific date, indexed helpers
  const dayBookings = (date) =>
    bookings.filter((b) => b.booking_date === date && b.status !== "Cancelled" && b.status !== "No Show");

  // For a vet column + slot: find booking that occupies this slot
  const findBooking = (date, vetId, slot) => {
    const slotMin = toMinutes(slot);
    return dayBookings(date).find((b) => {
      const bVet = b.veterinarian_id || NO_VET;
      if (bVet !== vetId) return false;
      const start = toMinutes(b.booking_time);
      if (start == null) return false;
      const end = start + (b.duration_minutes || SLOT_STEP);
      return slotMin >= start && slotMin < end;
    });
  };

  const label = view === "week"
    ? `${moment(cursor).startOf("isoWeek").format("D MMM")} - ${moment(cursor).startOf("isoWeek").add(6, "days").format("D MMM YYYY")}`
    : moment(cursor).format("dddd D MMMM YYYY");

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>วันนี้</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => step(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => step(1)}><ChevronRight className="w-4 h-4" /></Button>
          <div className="font-semibold flex items-center gap-2 ml-1"><CalendarDays className="w-4 h-4 text-primary" />{label}</div>
        </div>
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          <button onClick={() => setView("day")} className={"px-3 py-1 text-sm rounded-md " + (view === "day" ? "bg-white shadow-sm font-medium" : "text-muted-foreground")}>วัน</button>
          <button onClick={() => setView("week")} className={"px-3 py-1 text-sm rounded-md " + (view === "week" ? "bg-white shadow-sm font-medium" : "text-muted-foreground")}>สัปดาห์</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-dashed border-border inline-block" />ว่าง</span>
        {["Booked", "Confirmed", "Checked In"].map((s) => (
          <span key={s} className="flex items-center gap-1"><span className={"w-3 h-3 rounded inline-block " + statusConfig[s].dot} />{statusConfig[s].label}</span>
        ))}
      </div>

      {view === "day" ? (
        <DayView slots={slots} columns={columns} cursor={cursor} findBooking={findBooking} onCreateSlot={onCreateSlot} />
      ) : (
        <WeekView cursor={cursor} vets={vets} dayBookings={dayBookings} onDayClick={(d) => { setCursor(d); setView("day"); }} />
      )}
    </div>
  );
}

function DayView({ slots, columns, cursor, findBooking, onCreateSlot }) {
  return (
    <div className="border rounded-xl overflow-x-auto bg-white">
      <div className="min-w-[640px]">
        {/* header */}
        <div className="grid sticky top-0 z-10 bg-muted/40 border-b" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(120px, 1fr))` }}>
          <div className="p-2 text-xs font-medium text-muted-foreground">เวลา</div>
          {columns.map((c) => (
            <div key={c.id} className="p-2 text-sm font-medium border-l text-center truncate flex items-center justify-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" /><span className="truncate">{c.name}</span>
            </div>
          ))}
        </div>
        {/* rows */}
        {slots.map((slot) => (
          <div key={slot} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(120px, 1fr))` }}>
            <div className="p-2 text-xs text-muted-foreground border-r">{slot}</div>
            {columns.map((c) => {
              const b = findBooking(cursor, c.id, slot);
              const isStart = b && b.booking_time === slot;
              if (b && !isStart) {
                // continuation cell of a multi-slot booking
                return <div key={c.id} className="border-l bg-primary/5" />;
              }
              if (b && isStart) {
                const sc = statusConfig[b.status] || statusConfig.Booked;
                const spanSlots = Math.max(1, Math.round((b.duration_minutes || 30) / 30));
                return (
                  <div key={c.id} className="border-l p-1">
                    <div className={"rounded-md border p-1.5 text-xs h-full " + sc.color} style={{ minHeight: spanSlots > 1 ? spanSlots * 36 - 8 : undefined }}>
                      <div className="font-semibold truncate">{b.pet_name}</div>
                      <div className="truncate opacity-80">{b.service_type}</div>
                      <div className="truncate opacity-70">{b.owner_name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="opacity-70">{b.duration_minutes || 30} น.</span>
                        <span className="opacity-40">•</span>
                        <span>{sc.label}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              // empty slot
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCreateSlot({ date: cursor, time: slot, vetId: c.id === "__none__" ? null : c.id, vetName: c.name })}
                  className="border-l h-9 hover:bg-primary/10 transition-colors group flex items-center justify-center"
                  title={`สร้างคิว ${slot} · ${c.name}`}
                >
                  <Plus className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ cursor, vets, dayBookings, onDayClick }) {
  const start = moment(cursor).startOf("isoWeek");
  const days = Array.from({ length: 7 }, (_, i) => start.clone().add(i, "days"));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {days.map((d) => {
        const date = d.format("YYYY-MM-DD");
        const list = dayBookings(date).sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || ""));
        const isToday = date === moment().format("YYYY-MM-DD");
        return (
          <button key={date} onClick={() => onDayClick(date)} className={"text-left border rounded-xl p-2 bg-white hover:border-primary transition-colors " + (isToday ? "border-primary ring-1 ring-primary/30" : "")}>
            <div className="text-xs text-muted-foreground">{d.format("ddd")}</div>
            <div className={"text-sm font-semibold mb-2 " + (isToday ? "text-primary" : "")}>{d.format("D MMM")}</div>
            <div className="space-y-1">
              {list.length === 0 ? (
                <div className="text-xs text-muted-foreground/60 py-2">ว่าง</div>
              ) : list.slice(0, 5).map((b) => (
                <div key={b.id} className="text-xs rounded bg-primary/10 text-primary px-1.5 py-1 truncate">
                  {b.booking_time} {b.pet_name}
                </div>
              ))}
              {list.length > 5 && <div className="text-[11px] text-muted-foreground">+ อีก {list.length - 5}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}