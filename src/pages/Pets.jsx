import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PawPrint, Plus, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/shared/EmptyState";

const speciesList = ["สุนัข", "แมว", "นก", "กระต่าย", "สัตว์เลื้อยคลาน", "อื่นๆ"];

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", species: "สุนัข", breed: "", owner_name: "", owner_phone: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const loadPets = async () => {
    try {
      const data = await base44.entities.Pet.filter({}, "-created_date", 200);
      setPets(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadPets(); }, []);

  const filtered = pets.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterSpecies !== "all" && p.species !== filterSpecies) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.name?.toLowerCase().includes(q) || p.owner_name?.toLowerCase().includes(q) || p.owner_phone?.includes(q));
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.name || !form.owner_name || !form.owner_phone) return;
    setSaving(true);
    try {
      await base44.entities.Pet.create(form);
      setShowAdd(false);
      setForm({ name: "", species: "สุนัข", breed: "", owner_name: "", owner_phone: "" });
      loadPets();
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">สัตว์เลี้ยง</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} รายการ</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />เพิ่มสัตว์เลี้ยง</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อสัตว์ / เจ้าของ / เบอร์โทร" className="pl-9" />
        </div>
        <Select value={filterSpecies} onValueChange={setFilterSpecies}>
          <SelectTrigger className="w-40"><SelectValue placeholder="ชนิดสัตว์" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกชนิด</SelectItem>
            {speciesList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pet List */}
      {filtered.length === 0 ? (
        <EmptyState icon={PawPrint} title="ยังไม่มีสัตว์เลี้ยง" description="เพิ่มสัตว์เลี้ยงตัวแรกเพื่อเริ่มต้นใช้งาน" action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />เพิ่มสัตว์เลี้ยง</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pet) => (
            <button key={pet.id} onClick={() => navigate(`/pets/${pet.id}`)} className="bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                  {pet.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">{pet.species} {pet.breed ? `• ${pet.breed}` : ""}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{pet.owner_name} • {pet.owner_phone}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${pet.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {pet.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>เพิ่มสัตว์เลี้ยงใหม่</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ชนิดสัตว์ *</Label>
                <Select value={form.species} onValueChange={(v) => setForm({...form, species: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{speciesList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>สายพันธุ์</Label><Input value={form.breed} onChange={(e) => setForm({...form, breed: e.target.value})} /></div>
            </div>
            <div><Label>ชื่อเจ้าของ *</Label><Input value={form.owner_name} onChange={(e) => setForm({...form, owner_name: e.target.value})} /></div>
            <div><Label>เบอร์โทรเจ้าของ *</Label><Input value={form.owner_phone} onChange={(e) => setForm({...form, owner_phone: e.target.value})} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}