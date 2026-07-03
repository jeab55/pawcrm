import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Mail, MapPin, PawPrint, Plus, Pencil, Camera } from "lucide-react";
import moment from "moment";
import EmptyState from "@/components/shared/EmptyState";

const speciesList = ["สุนัข", "แมว", "นก", "กระต่าย", "สัตว์เลื้อยคลาน", "อื่นๆ"];

export default function OwnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [petForm, setPetForm] = useState({ name: "", species: "สุนัข", breed: "", gender: "", date_of_birth: "" });

  const loadData = async () => {
    try {
      const o = await base44.entities.Owner.get(id);
      setOwner(o);
      setEditForm({ name: o.name, phone: o.phone, email: o.email || "", address: o.address || "", notes: o.notes || "", photo_url: o.photo_url || "", status: o.status || "Active" });
      const allPets = await base44.entities.Pet.list("-created_date", 200);
      setPets(allPets.filter((p) => p.owner_id === id));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm((f) => ({ ...f, photo_url: file_url }));
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await base44.entities.Owner.update(id, editForm);
      setShowEdit(false);
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleAddPet = async () => {
    if (!petForm.name) return;
    setSaving(true);
    try {
      await base44.entities.Pet.create({
        ...petForm,
        owner_id: id,
        owner_name: owner.name,
        owner_phone: owner.phone,
        owner_email: owner.email || "",
        owner_address: owner.address || "",
        status: "Active",
      });
      setShowAddPet(false);
      setPetForm({ name: "", species: "สุนัข", breed: "", gender: "", date_of_birth: "" });
      loadData();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!owner) return <div className="text-center py-20 text-muted-foreground">ไม่พบเจ้าของ</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/owners")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {owner.photo_url ? (
              <img src={owner.photo_url} alt={owner.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0">
                {owner.name?.[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{owner.name}</h1>
                <Badge className={owner.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>{owner.status}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{owner.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{owner.email || "-"}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{owner.address || "-"}</div>
              </div>
              {owner.notes && <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/40 rounded-lg">{owner.notes}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}><Pencil className="w-4 h-4 mr-1" />แก้ไข</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><PawPrint className="w-5 h-5 text-primary" />สัตว์เลี้ยง ({pets.length})</h2>
        <Button size="sm" onClick={() => setShowAddPet(true)}><Plus className="w-4 h-4 mr-1" />เพิ่มสัตว์เลี้ยง</Button>
      </div>

      {pets.length === 0 ? (
        <EmptyState icon={PawPrint} title="ยังไม่มีสัตว์เลี้ยง" description="เพิ่มสัตว์เลี้ยงสำหรับเจ้าของคนนี้" action={<Button onClick={() => setShowAddPet(true)}><Plus className="w-4 h-4 mr-2" />เพิ่มสัตว์เลี้ยง</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <button key={pet.id} onClick={() => navigate(`/pets/${pet.id}`)} className="bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{pet.name?.[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">{pet.species} {pet.breed ? `• ${pet.breed}` : ""}</p>
                  {pet.date_of_birth && <p className="text-xs text-muted-foreground mt-1">อายุ {moment().diff(moment(pet.date_of_birth), "years")} ปี</p>}
                </div>
                <Badge className={pet.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"} variant="outline">{pet.status}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">แก้ไขข้อมูลเจ้าของ</h2>
            <div className="flex justify-center">
              <label className="cursor-pointer relative">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary">
                  {editForm.photo_url ? <img src={editForm.photo_url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <div><Label>ชื่อ *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>เบอร์โทร *</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><Label>อีเมล</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div><Label>ที่อยู่</Label><Textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} rows={2} /></div>
            <div><Label>หมายเหตุ</Label><Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEdit(false)}>ยกเลิก</Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
            </div>
          </div>
        </div>
      )}

      {showAddPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddPet(false)}>
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">เพิ่มสัตว์เลี้ยงสำหรับ {owner.name}</h2>
            <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ชนิด</Label><Input value={petForm.species} onChange={(e) => setPetForm({ ...petForm, species: e.target.value })} /></div>
              <div><Label>สายพันธุ์</Label><Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>เพศ</Label><Input value={petForm.gender} onChange={(e) => setPetForm({ ...petForm, gender: e.target.value })} placeholder="ผู้/เมีย" /></div>
              <div><Label>วันเกิด</Label><Input type="date" value={petForm.date_of_birth} onChange={(e) => setPetForm({ ...petForm, date_of_birth: e.target.value })} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPet(false)}>ยกเลิก</Button>
              <Button className="flex-1" onClick={handleAddPet} disabled={saving || !petForm.name}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}