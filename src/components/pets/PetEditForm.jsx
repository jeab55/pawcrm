import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const speciesList = ["สุนัข", "แมว", "นก", "กระต่าย", "สัตว์เลื้อยคลาน", "อื่นๆ"];
const genderList = ["ผู้", "เมีย"];
const statusList = ["Active", "Inactive", "Deceased"];

export default function PetEditForm({ open, onOpenChange, pet, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && pet) {
      setForm({
        name: pet.name || "",
        species: pet.species || "สุนัข",
        breed: pet.breed || "",
        gender: pet.gender || "",
        date_of_birth: pet.date_of_birth || "",
        weight: pet.weight ?? "",
        color: pet.color || "",
        microchip_id: pet.microchip_id || "",
        owner_name: pet.owner_name || "",
        owner_phone: pet.owner_phone || "",
        owner_email: pet.owner_email || "",
        status: pet.status || "Active",
        allergies: pet.allergies || "",
      });
      setError("");
    }
  }, [open, pet]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.species || !form.owner_name || !form.owner_phone) {
      setError("กรุณากรอกฟิลด์ที่มีเครื่องหมาย * ให้ครบ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, weight: form.weight === "" ? undefined : Number(form.weight) };
      await base44.entities.Pet.update(pet.id, payload);
      onOpenChange(false);
      onSaved && onSaved();
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลสัตว์เลี้ยง</DialogTitle>
          <DialogDescription>แก้ไขรายละเอียดของสัตว์เลี้ยงและข้อมูลเจ้าของ ฟิลด์ที่มี * จำเป็นต้องกรอก</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.name} onChange={(e) => upd("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ชนิดสัตว์ *</Label>
              <Select value={form.species} onValueChange={(v) => upd("species", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{speciesList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>สายพันธุ์</Label><Input value={form.breed} onChange={(e) => upd("breed", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>เพศ</Label>
              <Select value={form.gender || undefined} onValueChange={(v) => upd("gender", v)}>
                <SelectTrigger><SelectValue placeholder="เลือกเพศ" /></SelectTrigger>
                <SelectContent>{genderList.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>วันเกิด</Label><Input type="date" value={form.date_of_birth} onChange={(e) => upd("date_of_birth", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>น้ำหนัก (กก.)</Label><Input type="number" value={form.weight} onChange={(e) => upd("weight", e.target.value)} /></div>
            <div><Label>สี</Label><Input value={form.color} onChange={(e) => upd("color", e.target.value)} /></div>
          </div>
          <div><Label>เลขไมโครชิป</Label><Input value={form.microchip_id} onChange={(e) => upd("microchip_id", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>ชื่อเจ้าของ *</Label><Input value={form.owner_name} onChange={(e) => upd("owner_name", e.target.value)} /></div>
            <div><Label>เบอร์โทรเจ้าของ *</Label><Input value={form.owner_phone} onChange={(e) => upd("owner_phone", e.target.value)} /></div>
          </div>
          <div><Label>อีเมลเจ้าของ</Label><Input value={form.owner_email} onChange={(e) => upd("owner_email", e.target.value)} /></div>
          <div>
            <Label>สถานะ</Label>
            <Select value={form.status} onValueChange={(v) => upd("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>ภูมิแพ้/ข้อควรระวัง</Label><Textarea value={form.allergies} onChange={(e) => upd("allergies", e.target.value)} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}