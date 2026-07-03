import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, FileImage } from "lucide-react";

const recordTypes = ["ตรวจทั่วไป", "ผลตรวจแล็บ", "ภาพเอกซเรย์", "ติดตามอาการ", "ผ่าตัด", "ฉุกเฉิน", "อื่นๆ"];

export default function MedicalRecordForm({ pet, vets, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    record_type: "ตรวจทั่วไป",
    title: "",
    diagnosis: "",
    treatment: "",
    notes: "",
    weight: "",
    temperature: "",
    vet_id: "",
  });
  const [attachments, setAttachments] = useState([]);

  const reset = () => {
    setForm({ record_type: "ตรวจทั่วไป", title: "", diagnosis: "", treatment: "", notes: "", weight: "", temperature: "", vet_id: "" });
    setAttachments([]);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setAttachments((prev) => [...prev, ...urls]);
    } catch (err) { console.error(err); }
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedVet = vets?.find((v) => v.id === form.vet_id);
      await base44.entities.MedicalRecord.create({
        pet_id: pet.id,
        pet_name: pet.name,
        owner_name: pet.owner_name,
        vet_id: form.vet_id || undefined,
        vet_name: selectedVet?.name || undefined,
        record_date: new Date().toISOString(),
        record_type: form.record_type,
        title: form.title || undefined,
        diagnosis: form.diagnosis || undefined,
        treatment: form.treatment || undefined,
        notes: form.notes || undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      reset();
      setOpen(false);
      onSaved?.();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90">
        <FileImage className="w-4 h-4 mr-2" />เพิ่มเวชระเบียน
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
      <div className="bg-background rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">เพิ่มเวชระเบียน — {pet.name}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>ประเภท</Label>
            <Select value={form.record_type} onValueChange={(v) => setForm({ ...form, record_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{recordTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>สัตวแพทย์</Label>
            <Select value={form.vet_id} onValueChange={(v) => setForm({ ...form, vet_id: v })}>
              <SelectTrigger><SelectValue placeholder="เลือกแพทย์" /></SelectTrigger>
              <SelectContent>
                {vets?.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div><Label>หัวข้อ</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น ตรวจสุขภาพประจำปี" /></div>
        <div><Label>การวินิจฉัย</Label><Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows={2} placeholder="ผลการวินิจฉัย..." /></div>
        <div><Label>การรักษา / คำแนะนำ</Label><Textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} rows={2} placeholder="แผนการรักษา..." /></div>

        <div className="grid grid-cols-2 gap-3">
          <div><Label>น้ำหนัก (กก.)</Label><Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
          <div><Label>อุณหภูมิ (°C)</Label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
        </div>

        <div><Label>หมายเหตุ</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

        {/* Attachments */}
        <div className="space-y-2">
          <Label>แนบรูปภาพ / ภาพเอกซเรย์ / ผลตรวจแล็บ</Label>
          <label className="flex items-center justify-center gap-2 w-full p-4 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer text-sm text-muted-foreground">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังอัปโหลด...</> : <><Upload className="w-4 h-4" /> คลิกเพื่อเลือกไฟล์</>}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          {attachments.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {attachments.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                  <button onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>ยกเลิก</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </div>
      </div>
    </div>
  );
}