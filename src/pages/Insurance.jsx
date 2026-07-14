import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Plus, FileText, CheckCircle, XCircle, Clock, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KPICard from "@/components/shared/KPICard";
import EmptyState from "@/components/shared/EmptyState";
import moment from "moment";

const formatBaht = (n) => `฿${(n || 0).toLocaleString()}`;
const statuses = ["Draft", "Submitted", "Review", "Approved", "Rejected", "Paid"];

export default function Insurance() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pet_name: "", owner_name: "", insurance_company: "", policy_number: "", claim_amount: 0, diagnosis: "", treatment_summary: "" });

  const load = async () => {
    try { setClaims(await base44.entities.InsuranceClaim.filter({}, "-created_date", 500)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const thisMonth = claims.filter((c) => moment(c.created_date).isSame(moment(), "month"));
  const draft = thisMonth.filter((c) => c.status === "Draft").length;
  const submitted = thisMonth.filter((c) => c.status === "Submitted").length;
  const approved = thisMonth.filter((c) => c.status === "Approved").length;
  const rejected = thisMonth.filter((c) => c.status === "Rejected").length;
  const paidAmt = thisMonth.filter((c) => c.status === "Paid").reduce((s, c) => s + (c.approved_amount || c.claim_amount || 0), 0);

  const filtered = filterStatus === "all" ? claims : claims.filter((c) => c.status === filterStatus);

  const handleSave = async () => {
    if (!form.pet_name || !form.insurance_company || !form.claim_amount) return;
    const claimNum = `CLM-${moment().format("YYYYMMDD")}-${String(claims.length + 1).padStart(3, "0")}`;
    try {
      await base44.entities.InsuranceClaim.create({ ...form, claim_number: claimNum, status: "Draft" });
      setShowAdd(false);
      setForm({ pet_name: "", owner_name: "", insurance_company: "", policy_number: "", claim_amount: 0, diagnosis: "", treatment_summary: "" });
      load();
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try { await base44.entities.InsuranceClaim.update(id, { status, ...(status === "Submitted" ? { submitted_date: moment().format("YYYY-MM-DD") } : {}) }); load(); } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const statusColors = { Draft: "bg-gray-100 text-gray-700", Submitted: "bg-blue-100 text-blue-700", Review: "bg-purple-100 text-purple-700", Approved: "bg-emerald-100 text-emerald-700", Rejected: "bg-red-100 text-red-700", Paid: "bg-green-100 text-green-800" };
  const statusLabels = { Draft: "ร่าง", Submitted: "ส่งแล้ว", Review: "ตรวจสอบ", Approved: "อนุมัติ", Rejected: "ปฏิเสธ", Paid: "จ่ายแล้ว" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">ประกัน & เคลม</h1><p className="text-muted-foreground text-sm">ติดตามและส่งเคลมประกัน</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />สร้างเคลม</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={FileText} label="Draft" value={draft} color="primary" />
        <KPICard icon={Clock} label="Submitted" value={submitted} color="blue" />
        <KPICard icon={CheckCircle} label="Approved" value={approved} color="emerald" />
        <KPICard icon={XCircle} label="Rejected" value={rejected} color="red" />
        <KPICard icon={Banknote} label="Paid เดือนนี้" value={formatBaht(paidAmt)} color="emerald" />
      </div>

      <div className="flex gap-1 flex-wrap">
        <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 text-sm rounded-lg ${filterStatus === "all" ? "bg-primary text-white" : "bg-white border hover:bg-muted"}`}>ทั้งหมด</button>
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 text-sm rounded-lg ${filterStatus === s ? "bg-primary text-white" : "bg-white border hover:bg-muted"}`}>
            {statusLabels[s]} ({claims.filter(c => c.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="ยังไม่มีเคลม" description={filterStatus === "all" ? "กดปุ่ม “สร้างเคลม” ด้านบนขวาเพื่อเริ่มติดตามเคลมประกัน" : "ไม่มีเคลมในสถานะนี้"} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 text-left">
              <th className="p-3 font-medium">เลขที่เคลม</th>
              <th className="p-3 font-medium">สัตว์เลี้ยง</th>
              <th className="p-3 font-medium hidden md:table-cell">บริษัทประกัน</th>
              <th className="p-3 font-medium text-right">จำนวนเงิน</th>
              <th className="p-3 font-medium">สถานะ</th>
              <th className="p-3 font-medium">จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{c.claim_number || "-"}</td>
                  <td className="p-3 font-medium">{c.pet_name}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.insurance_company}</td>
                  <td className="p-3 text-right font-semibold">{formatBaht(c.claim_amount)}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status]}`}>{statusLabels[c.status]}</span></td>
                  <td className="p-3">
                    <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างเคลมประกัน</DialogTitle>
            <DialogDescription>กรอกข้อมูลเคลมประกันสำหรับสัตว์เลี้ยง ฟิลด์ที่มี * จำเป็นต้องกรอก</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.pet_name} onChange={(e) => setForm({...form, pet_name: e.target.value})} /></div>
              <div><Label>ชื่อเจ้าของ</Label><Input value={form.owner_name} onChange={(e) => setForm({...form, owner_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>บริษัทประกัน *</Label><Input value={form.insurance_company} onChange={(e) => setForm({...form, insurance_company: e.target.value})} /></div>
              <div><Label>เลขกรมธรรม์</Label><Input value={form.policy_number} onChange={(e) => setForm({...form, policy_number: e.target.value})} /></div>
            </div>
            <div><Label>จำนวนเงินเคลม (฿) *</Label><Input type="number" value={form.claim_amount} onChange={(e) => setForm({...form, claim_amount: Number(e.target.value)})} /></div>
            <div><Label>การวินิจฉัย</Label><Input value={form.diagnosis} onChange={(e) => setForm({...form, diagnosis: e.target.value})} /></div>
            <div><Label>สรุปการรักษา</Label><Input value={form.treatment_summary} onChange={(e) => setForm({...form, treatment_summary: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full">บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}