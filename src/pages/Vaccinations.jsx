import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Syringe, Plus, AlertTriangle, Clock, CheckCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KPICard from "@/components/shared/KPICard";
import EmptyState from "@/components/shared/EmptyState";
import moment from "moment";

const vaccineTypes = ["โรคพิษสุนัขบ้า", "รวม 5 โรค", "รวม 4 โรค", "ไข้หัดแมว", "FeLV", "Bordetella", "อื่นๆ"];

export default function Vaccinations() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [filterType, setFilterType] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pet_name: "", vaccine_name: "", vaccine_type: "โรคพิษสุนัขบ้า", lot_number: "", administered_date: moment().format("YYYY-MM-DD"), next_due_date: "", vet_name: "" });

  const load = async () => {
    try { setRecords(await base44.entities.Vaccination.filter({}, "-created_date", 500)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const today = moment();
  const thisMonth = records.filter((r) => moment(r.administered_date).isSame(today, "month")).length;
  const upcoming7 = records.filter((r) => r.next_due_date && moment(r.next_due_date).isAfter(today) && moment(r.next_due_date).isBefore(today.clone().add(7, "days"))).length;
  const overdue = records.filter((r) => r.next_due_date && moment(r.next_due_date).isBefore(today)).length;
  const reminderSent = records.filter((r) => r.reminder_sent).length;

  const filtered = records.filter((r) => {
    if (filterType !== "all" && r.vaccine_type !== filterType) return false;
    if (tab === "upcoming") return r.next_due_date && moment(r.next_due_date).isAfter(today) && moment(r.next_due_date).isBefore(today.clone().add(30, "days"));
    if (tab === "overdue") return r.next_due_date && moment(r.next_due_date).isBefore(today);
    return true;
  });

  const handleSave = async () => {
    if (!form.pet_name || !form.vaccine_name) return;
    try {
      await base44.entities.Vaccination.create({ ...form, status: "Completed" });
      setShowAdd(false);
      setForm({ pet_name: "", vaccine_name: "", vaccine_type: "โรคพิษสุนัขบ้า", lot_number: "", administered_date: moment().format("YYYY-MM-DD"), next_due_date: "", vet_name: "" });
      load();
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">วัคซีน</h1><p className="text-muted-foreground text-sm">ติดตามการฉีดวัคซีน</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />บันทึกวัคซีน</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Syringe} label="เดือนนี้" value={thisMonth} color="primary" />
        <KPICard icon={Clock} label="ใกล้กำหนด 7 วัน" value={upcoming7} color="amber" />
        <KPICard icon={AlertTriangle} label="เกินกำหนด" value={overdue} color="red" />
        <KPICard icon={Bell} label="Reminder ส่งแล้ว" value={reminderSent} color="blue" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1">
          {[{ l: "ใกล้กำหนด", v: "upcoming" }, { l: "เกินกำหนด", v: "overdue" }, { l: "ทั้งหมด", v: "all" }].map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`px-4 py-2 text-sm rounded-lg ${tab === t.v ? "bg-primary text-white" : "bg-white border hover:bg-muted"}`}>{t.l}</button>
          ))}
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="ชนิดวัคซีน" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกชนิด</SelectItem>
            {vaccineTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Syringe} title="ไม่มีข้อมูล" description="ยังไม่มีรายการวัคซีนในหมวดนี้" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 text-left">
              <th className="p-3 font-medium">สัตว์เลี้ยง</th>
              <th className="p-3 font-medium">วัคซีน</th>
              <th className="p-3 font-medium hidden md:table-cell">Lot</th>
              <th className="p-3 font-medium">ฉีดเมื่อ</th>
              <th className="p-3 font-medium">ครั้งถัดไป</th>
              <th className="p-3 font-medium">สถานะ</th>
            </tr></thead>
            <tbody>
              {filtered.map((r) => {
                const isOverdue = r.next_due_date && moment(r.next_due_date).isBefore(today);
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.pet_name}</td>
                    <td className="p-3">{r.vaccine_name}<br/><span className="text-xs text-muted-foreground">{r.vaccine_type}</span></td>
                    <td className="p-3 hidden md:table-cell">{r.lot_number || "-"}</td>
                    <td className="p-3">{r.administered_date}</td>
                    <td className="p-3">{r.next_due_date || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${isOverdue ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {isOverdue ? "เกินกำหนด" : "ปกติ"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกวัคซีน</DialogTitle>
            <DialogDescription>บันทึกประวัติการฉีดวัคซีนและนัดครั้งถัดไป ฟิลด์ที่มี * จำเป็นต้องกรอก</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.pet_name} onChange={(e) => setForm({...form, pet_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>ชื่อวัคซีน *</Label><Input value={form.vaccine_name} onChange={(e) => setForm({...form, vaccine_name: e.target.value})} /></div>
              <div>
                <Label>ประเภท</Label>
                <Select value={form.vaccine_type} onValueChange={(v) => setForm({...form, vaccine_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{vaccineTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Lot Number</Label><Input value={form.lot_number} onChange={(e) => setForm({...form, lot_number: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>วันที่ฉีด</Label><Input type="date" value={form.administered_date} onChange={(e) => setForm({...form, administered_date: e.target.value})} /></div>
              <div><Label>นัดครั้งถัดไป</Label><Input type="date" value={form.next_due_date} onChange={(e) => setForm({...form, next_due_date: e.target.value})} /></div>
            </div>
            <div><Label>สัตวแพทย์</Label><Input value={form.vet_name} onChange={(e) => setForm({...form, vet_name: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full">บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}