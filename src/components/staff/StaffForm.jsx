import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LIST, STAFF_ROLES } from "@/lib/staff";

const COLORS = ["green", "blue", "purple", "orange", "pink", "teal", "indigo", "red"];
const COLOR_DOT = {
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500", orange: "bg-orange-500",
  pink: "bg-pink-500", teal: "bg-teal-500", indigo: "bg-indigo-500", red: "bg-red-500",
};

const empty = {
  full_name: "", nickname: "", role: "counter", phone: "", email: "",
  active: true, color: "green", linked_user_email: "", veterinarian_id: "", notes: "",
};

export default function StaffForm({ open, onOpenChange, staff, vets, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(staff ? { ...empty, ...staff } : empty);
  }, [open, staff]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.role !== "veterinarian") payload.veterinarian_id = "";
      if (staff?.id) await base44.entities.Staff.update(staff.id, payload);
      else await base44.entities.Staff.create(payload);
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลพนักงาน บทบาท และสีป้ายกำกับ ฟิลด์ที่มี * จำเป็นต้องกรอก</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ชื่อ-นามสกุล *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="เช่น สมหญิง ใจดี" />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อเล่น</Label>
              <Input value={form.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="เช่น แนน" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>บทบาท</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_LIST.map((r) => <SelectItem key={r} value={r}>{STAFF_ROLES[r].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>สีป้ายกำกับ</Label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className={`w-7 h-7 rounded-full ${COLOR_DOT[c]} ${form.color === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {form.role === "veterinarian" && vets?.length > 0 && (
            <div className="space-y-1.5">
              <Label>เชื่อมกับสัตวแพทย์</Label>
              <Select value={form.veterinarian_id || "none"} onValueChange={(v) => set("veterinarian_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="เลือกสัตวแพทย์" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่เชื่อม</SelectItem>
                  {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>เบอร์โทร</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08x-xxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="staff@clinic.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>อีเมลบัญชี login ที่ผูก (ไม่บังคับ)</Label>
            <Input value={form.linked_user_email} onChange={(e) => set("linked_user_email", e.target.value)} placeholder="สำหรับผูกกับบัญชีในอนาคต" />
          </div>

          <div className="space-y-1.5">
            <Label>หมายเหตุ</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">กำลังใช้งาน</div>
              <div className="text-xs text-muted-foreground">ปิดเพื่อพักการใช้งานพนักงานคนนี้</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.full_name.trim()}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}