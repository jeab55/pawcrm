import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Plus, Search, Phone, Mail, Camera, Pencil } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

const specializations = ["อายุรกรรมสัตว์", "ศัลยกรรม", "ตรวจวินิจฉัย", "วัคซีนและป้องกัน", "ทันตกรรม", "ผิวหนัง", "อายุรกรรม", "ฉุกเฉิน", "อื่นๆ"];
const vetColors = ["green", "blue", "purple", "orange", "pink", "teal", "indigo", "red"];

const colorMap = {
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", ring: "ring-green-200" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", ring: "ring-purple-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", ring: "ring-orange-200" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500", ring: "ring-pink-200" },
  teal: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500", ring: "ring-teal-200" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", ring: "ring-indigo-200" },
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", ring: "ring-red-200" },
};

export default function Veterinarians() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", specialization: "ตรวจวินิจฉัย", phone: "", email: "", license_number: "", color: "green", notes: "", photo_url: "", status: "Active" });

  const loadVets = async () => {
    try {
      const data = await base44.entities.Veterinarian.list("-created_date", 200);
      setVets(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadVets(); }, []);

  const filtered = vets.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name?.toLowerCase().includes(q) || v.specialization?.toLowerCase().includes(q) || v.phone?.includes(q);
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", specialization: "ตรวจวินิจฉัย", phone: "", email: "", license_number: "", color: "green", notes: "", photo_url: "", status: "Active" });
    setShowDialog(true);
  };

  const openEdit = (vet) => {
    setEditing(vet);
    setForm({
      name: vet.name, specialization: vet.specialization || "ตรวจวินิจฉัย", phone: vet.phone || "", email: vet.email || "",
      license_number: vet.license_number || "", color: vet.color || "green", notes: vet.notes || "", photo_url: vet.photo_url || "", status: vet.status || "Active"
    });
    setShowDialog(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, photo_url: file_url }));
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Veterinarian.update(editing.id, form);
      } else {
        await base44.entities.Veterinarian.create(form);
      }
      setShowDialog(false);
      loadVets();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">สัตวแพทย์</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} คน</p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />เพิ่มสัตวแพทย์</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ / ความเชี่ยวชาญ / เบอร์โทร" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="ยังไม่มีสัตวแพทย์" description="เพิ่มสัตวแพทย์เพื่อจัดการคิวและนัดหมาย" action={<Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />เพิ่มสัตวแพทย์</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vet) => {
            const c = colorMap[vet.color] || colorMap.green;
            return (
              <Card key={vet.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {vet.photo_url ? (
                        <img src={vet.photo_url} alt={vet.name} className={`w-14 h-14 rounded-2xl object-cover ring-2 ${c.ring}`} />
                      ) : (
                        <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-primary font-bold ring-2 ${c.ring}`}>
                          {vet.name?.[0]}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${c.dot} border-2 border-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{vet.name}</p>
                      <Badge className={`${c.bg} ${c.text} mb-1`} variant="outline">{vet.specialization}</Badge>
                      {vet.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{vet.phone}</div>}
                      {vet.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{vet.email}</div>}
                    </div>
                    <Badge className={vet.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"} variant="outline">
                      {vet.status === "Active" ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(vet)}><Pencil className="w-3.5 h-3.5 mr-1" />แก้ไข</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? "แก้ไขสัตวแพทย์" : "เพิ่มสัตวแพทย์"}</h2>
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary">
                  {form.photo_url ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <div><Label>ชื่อสัตวแพทย์ *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>ความเชี่ยวชาญ</Label>
              <Select value={form.specialization} onValueChange={(v) => setForm({ ...form, specialization: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{specializations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>เบอร์โทร</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>อีเมล</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label>เลขใบอนุญาต</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
            <div>
              <Label>สีประจำตัว (ใช้ในคิว/นัดหมาย)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {vetColors.map((col) => {
                  const c = colorMap[col];
                  return (
                    <button key={col} type="button" onClick={() => setForm({ ...form, color: col })}
                      className={`w-8 h-8 rounded-full ${c.dot} ${form.color === col ? "ring-2 ring-offset-2 ring-foreground" : ""}`} />
                  );
                })}
              </div>
            </div>
            <div><Label>หมายเหตุ</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}