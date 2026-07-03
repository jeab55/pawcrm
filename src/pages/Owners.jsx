import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Phone, Mail, Camera, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/shared/EmptyState";

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "", photo_url: "", status: "Active" });
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [ownerData, petData] = await Promise.all([
        base44.entities.Owner.list("-created_date", 200),
        base44.entities.Pet.list("-created_date", 200),
      ]);
      setOwners(ownerData);
      setPets(petData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const petCount = (ownerId) => pets.filter((p) => p.owner_id === ownerId).length;

  const filtered = owners.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.name?.toLowerCase().includes(q) || o.phone?.includes(q) || o.email?.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", notes: "", photo_url: "", status: "Active" });
    setShowDialog(true);
  };

  const openEdit = (owner) => {
    setEditing(owner);
    setForm({ name: owner.name, phone: owner.phone, email: owner.email || "", address: owner.address || "", notes: owner.notes || "", photo_url: owner.photo_url || "", status: owner.status || "Active" });
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
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Owner.update(editing.id, form);
      } else {
        await base44.entities.Owner.create(form);
      }
      setShowDialog(false);
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">เจ้าของสัตว์เลี้ยง</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} ราย</p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />เพิ่มเจ้าของ</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ / เบอร์โทร / อีเมล" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="ยังไม่มีเจ้าของสัตว์เลี้ยง" description="เพิ่มเจ้าของเพื่อจัดการสัตว์เลี้ยง" action={<Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />เพิ่มเจ้าของ</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((owner) => (
            <Card key={owner.id} className="hover:shadow-md transition-shadow cursor-pointer group" >
              <CardContent className="p-4" onClick={() => navigate(`/owners/${owner.id}`)}>
                <div className="flex items-start gap-3">
                  {owner.photo_url ? (
                    <img src={owner.photo_url} alt={owner.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {owner.name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{owner.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Phone className="w-3 h-3" /> {owner.phone}
                    </div>
                    {owner.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> {owner.email}
                      </div>
                    )}
                  </div>
                  <Badge className="bg-primary/10 text-primary" variant="outline">
                    {petCount(owner.id)} สัตว์
                  </Badge>
                </div>
              </CardContent>
              <div className="px-4 pb-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(owner); }}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> แก้ไข
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDialog(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? "แก้ไขเจ้าของ" : "เพิ่มเจ้าของใหม่"}</h2>
            <div className="flex justify-center">
              <label className="cursor-pointer relative">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary">
                  {form.photo_url ? (
                    <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                {uploading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}
              </label>
            </div>
            <div><Label>ชื่อเจ้าของ *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>เบอร์โทร *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>อีเมล</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>ที่อยู่</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
            <div><Label>หมายเหตุ</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name || !form.phone}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}