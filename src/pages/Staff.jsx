import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Search, Phone, Mail, Pencil, Power, Stethoscope, Pill, ClipboardList } from "lucide-react";
import KPICard from "@/components/shared/KPICard";
import EmptyState from "@/components/shared/EmptyState";
import StaffForm from "@/components/staff/StaffForm";
import { STAFF_ROLES, ROLE_LIST, colorClass, roleLabel } from "@/lib/staff";

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  const load = async () => {
    try {
      const [all, vetList] = await Promise.all([
        base44.entities.Staff.list("-created_date", 300),
        base44.entities.Veterinarian.list("-created_date", 100),
      ]);
      setStaff(all);
      setVets(vetList.filter((v) => v.status === "Active"));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const total = staff.length;
  const activeCount = staff.filter((s) => s.active !== false).length;
  const vetCount = staff.filter((s) => s.role === "veterinarian" && s.active !== false).length;
  const frontCount = staff.filter((s) => ["pharmacy", "counter", "cashier"].includes(s.role) && s.active !== false).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((s) => (filterRole === "all" ? true : s.role === filterRole))
      .filter((s) => (filterActive === "all" ? true : filterActive === "active" ? s.active !== false : s.active === false))
      .filter((s) => !q || s.full_name?.toLowerCase().includes(q) || s.nickname?.toLowerCase().includes(q) || s.phone?.includes(q));
  }, [staff, search, filterRole, filterActive]);

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setShowForm(true); };
  const toggleActive = async (s) => {
    try { await base44.entities.Staff.update(s.id, { active: !(s.active !== false) }); await load(); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" />พนักงาน</h1>
          <p className="text-muted-foreground text-sm">จัดการรายชื่อทีมงานคลินิก และระบุผู้รับผิดชอบงานในแต่ละจุด</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />เพิ่มพนักงาน</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="พนักงานทั้งหมด" value={total} color="primary" />
        <KPICard icon={Power} label="กำลังใช้งาน" value={activeCount} color="emerald" />
        <KPICard icon={Stethoscope} label="สัตวแพทย์" value={vetCount} color="teal" />
        <KPICard icon={Pill} label="ห้องยา/เคาน์เตอร์" value={frontCount} color="purple" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ / ชื่อเล่น / เบอร์โทร" className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="บทบาท" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกบทบาท</SelectItem>
            {ROLE_LIST.map((r) => <SelectItem key={r} value={r}>{STAFF_ROLES[r].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="active">กำลังใช้งาน</SelectItem>
            <SelectItem value="inactive">พักใช้งาน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="ยังไม่มีพนักงาน" description="กดปุ่ม “เพิ่มพนักงาน” เพื่อสร้างรายชื่อทีมงาน" action={<Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />เพิ่มพนักงาน</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const inactive = s.active === false;
            return (
              <div key={s.id} className={`bg-white rounded-xl border p-4 space-y-3 ${inactive ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border ${colorClass(s.color)}`}>
                    {(s.nickname || s.full_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground">{s.nickname && `(${s.nickname}) · `}<Badge variant="outline" className={colorClass(s.color)}>{roleLabel(s.role)}</Badge></div>
                  </div>
                  {inactive && <Badge variant="outline" className="bg-gray-100 text-gray-500">พัก</Badge>}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {s.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{s.phone}</div>}
                  {s.email && <div className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5" />{s.email}</div>}
                </div>
                <div className="flex gap-2 pt-1 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5 mr-1" />แก้ไข</Button>
                  <Button variant="ghost" size="sm" className={inactive ? "text-emerald-600" : "text-muted-foreground"} onClick={() => toggleActive(s)}>
                    <Power className="w-3.5 h-3.5 mr-1" />{inactive ? "เปิด" : "ปิด"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StaffForm open={showForm} onOpenChange={setShowForm} staff={editing} vets={vets} onSaved={load} />
    </div>
  );
}