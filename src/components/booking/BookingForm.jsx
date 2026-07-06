import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment";

const serviceTypes = ["ตรวจทั่วไป", "วัคซีน", "ทำแผล", "อาบน้ำตัดขน", "ฉุกเฉิน", "ทันตกรรม", "ผ่าตัด", "อื่นๆ"];
const sources = ["Phone", "Walk-in", "LINE", "Online"];
const sourceLabels = { Phone: "โทรศัพท์", "Walk-in": "หน้าร้าน", LINE: "LINE", Online: "ออนไลน์" };

const emptyForm = {
  pet_name: "", species: "", breed: "",
  owner_name: "", owner_phone: "",
  booking_date: moment().format("YYYY-MM-DD"), booking_time: "",
  service_type: "ตรวจทั่วไป",
  veterinarian_id: "", symptoms_or_note: "", source: "Phone",
};

export default function BookingForm({ open, onOpenChange, vets, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.pet_name || !form.owner_name || !form.owner_phone || !form.booking_date || !form.booking_time || !form.service_type) {
      setError("กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ");
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
        service_type: form.service_type,
        veterinarian_id: form.veterinarian_id || undefined,
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
            <div><Label>วันที่จอง *</Label><Input type="date" value={form.booking_date} onChange={(e) => set("booking_date", e.target.value)} /></div>
            <div><Label>เวลาจอง *</Label><Input type="time" value={form.booking_time} onChange={(e) => set("booking_time", e.target.value)} /></div>
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
              <Select value={form.veterinarian_id} onValueChange={(v) => set("veterinarian_id", v)}>
                <SelectTrigger><SelectValue placeholder="เลือกแพทย์ (ถ้ามี)" /></SelectTrigger>
                <SelectContent>{vets?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>แหล่งที่มา</Label>
            <Select value={form.source} onValueChange={(v) => set("source", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div><Label>อาการ / หมายเหตุ</Label><Textarea value={form.symptoms_or_note} onChange={(e) => set("symptoms_or_note", e.target.value)} rows={2} /></div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "กำลังบันทึก..." : "บันทึกคิวจอง"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}