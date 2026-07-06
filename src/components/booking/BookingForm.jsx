import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import moment from "moment";
import { generateSlots, buildBusyIntervals, computeSlotAvailability, hasConflict } from "@/lib/vetSlots";

const serviceTypes = ["ตรวจทั่วไป", "วัคซีน", "ทำแผล", "อาบน้ำตัดขน", "ฉุกเฉิน", "ทันตกรรม", "ผ่าตัด", "อื่นๆ"];
const sources = ["Phone", "Walk-in", "LINE", "Online"];
const sourceLabels = { Phone: "โทรศัพท์", "Walk-in": "หน้าร้าน", LINE: "LINE", Online: "ออนไลน์" };
const durations = [15, 30, 45, 60];
const NO_VET = "none";

const emptyForm = {
  pet_name: "", species: "", breed: "",
  owner_name: "", owner_phone: "",
  booking_date: moment().format("YYYY-MM-DD"), booking_time: "",
  service_type: "ตรวจทั่วไป",
  veterinarian_id: NO_VET, duration_minutes: 30,
  symptoms_or_note: "", source: "Phone",
};

export default function BookingForm({ open, onOpenChange, vets, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Load existing schedule data whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError("");
    (async () => {
      try {
        const [bk, ap, vs] = await Promise.all([
          base44.entities.QueueBooking.list("-booking_date", 500),
          base44.entities.Appointment.list("-date", 500),
          base44.entities.Visit.list("-created_date", 200),
        ]);
        setBookings(bk); setAppointments(ap); setVisits(vs);
      } catch (e) { console.error(e); }
    })();
  }, [open]);

  const hasVet = form.veterinarian_id && form.veterinarian_id !== NO_VET;

  const busyIntervals = useMemo(() => {
    if (!hasVet || !form.booking_date) return [];
    return buildBusyIntervals({
      vetId: form.veterinarian_id, date: form.booking_date,
      bookings, appointments, visits,
    });
  }, [hasVet, form.veterinarian_id, form.booking_date, bookings, appointments, visits]);

  const slotAvailability = useMemo(
    () => computeSlotAvailability(busyIntervals, form.duration_minutes),
    [busyIntervals, form.duration_minutes]
  );

  const selectedConflict = hasVet && form.booking_time
    ? hasConflict(busyIntervals, form.booking_time, form.duration_minutes)
    : false;

  const pickSlot = (time, busyLabel) => {
    if (busyLabel) return; // disabled slot
    set("booking_time", time);
    setError("");
  };

  const handleSave = async () => {
    if (!form.pet_name || !form.owner_name || !form.owner_phone || !form.booking_date || !form.booking_time || !form.service_type) {
      setError("กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ");
      return;
    }
    if (hasVet && hasConflict(busyIntervals, form.booking_time, form.duration_minutes)) {
      setError("หมอท่านนี้มีคิวในช่วงเวลานี้แล้ว กรุณาเลือกเวลาอื่น");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const vet = vets?.find((v) => v.id === form.veterinarian_id);
      await base44.entities.QueueBooking.create({
        pet_name: form.pet_name,
        species: form.species || undefined,
        breed: form.breed || undefined,
        owner_name: form.owner_name,
        owner_phone: form.owner_phone,
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        duration_minutes: form.duration_minutes,
        service_type: form.service_type,
        veterinarian_id: hasVet ? form.veterinarian_id : undefined,
        veterinarian_name: vet?.name || undefined,
        symptoms_or_note: form.symptoms_or_note || undefined,
        source: form.source,
        status: "Booked",
      });
      setForm(emptyForm);
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
    setSaving(false);
  };

  const slots = generateSlots();

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setError(""); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>สร้างคิวจอง</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.pet_name} onChange={(e) => set("pet_name", e.target.value)} /></div>
            <div><Label>ชนิดสัตว์</Label><Input value={form.species} onChange={(e) => set("species", e.target.value)} placeholder="สุนัข / แมว" /></div>
          </div>
          <div><Label>สายพันธุ์</Label><Input value={form.breed} onChange={(e) => set("breed", e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>ชื่อเจ้าของ *</Label><Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></div>
            <div><Label>เบอร์โทร *</Label><Input value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ประเภทบริการ *</Label>
              <Select value={form.service_type} onValueChange={(v) => set("service_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>สัตวแพทย์</Label>
              <Select value={form.veterinarian_id} onValueChange={(v) => { set("veterinarian_id", v); set("booking_time", ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_VET}>ไม่ระบุหมอ</SelectItem>
                  {vets?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}{v.specialization ? ` · ${v.specialization}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>วันที่จอง *</Label><Input type="date" value={form.booking_date} onChange={(e) => { set("booking_date", e.target.value); set("booking_time", ""); }} /></div>
            <div>
              <Label>ระยะเวลา</Label>
              <Select value={String(form.duration_minutes)} onValueChange={(v) => { set("duration_minutes", Number(v)); set("booking_time", ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{durations.map((d) => <SelectItem key={d} value={String(d)}>{d} นาที</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Slot picker */}
          <div>
            <Label>เวลาจอง *</Label>
            {hasVet ? (
              <>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {slots.map((s) => {
                    const busyLabel = slotAvailability[s];
                    const selected = form.booking_time === s;
                    return (
                      <button
                        key={s} type="button"
                        onClick={() => pickSlot(s, busyLabel)}
                        disabled={!!busyLabel}
                        title={busyLabel || "ว่าง"}
                        className={
                          "h-9 rounded-md text-sm border transition-colors " +
                          (selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : busyLabel
                              ? "bg-muted text-muted-foreground/60 border-border line-through cursor-not-allowed"
                              : "bg-white hover:bg-primary/10 border-border")
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-border inline-block" />ว่าง</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border inline-block" />ไม่ว่าง</span>
                </div>
              </>
            ) : (
              <Input type="time" value={form.booking_time} onChange={(e) => set("booking_time", e.target.value)} className="mt-1" />
            )}
          </div>

          {hasVet && selectedConflict && (
            <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" />หมอท่านนี้มีคิวในช่วงเวลานี้แล้ว</p>
          )}

          <div>
            <Label>แหล่งที่มา</Label>
            <Select value={form.source} onValueChange={(v) => set("source", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div><Label>อาการ / หมายเหตุ</Label><Textarea value={form.symptoms_or_note} onChange={(e) => set("symptoms_or_note", e.target.value)} rows={2} /></div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSave} disabled={saving || (hasVet && selectedConflict)} className="w-full">{saving ? "กำลังบันทึก..." : "บันทึกคิวจอง"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}