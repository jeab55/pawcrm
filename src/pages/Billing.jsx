import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Receipt, Plus, Banknote, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KPICard from "@/components/shared/KPICard";
import EmptyState from "@/components/shared/EmptyState";
import moment from "moment";

const formatBaht = (n) => `฿${(n || 0).toLocaleString()}`;
const paymentMethods = ["เงินสด", "โอนธนาคาร", "บัตรเครดิต", "PromptPay", "อื่นๆ"];

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pet_name: "", owner_name: "", total: 0, notes: "" });

  const load = async () => {
    try { setInvoices(await base44.entities.Invoice.filter({}, "-created_date", 500)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const thisMonth = invoices.filter((i) => moment(i.created_date).isSame(moment(), "month"));
  const pendingAmount = invoices.filter((i) => i.status === "Pending").reduce((s, i) => s + (i.total || 0), 0);
  const monthRevenue = thisMonth.filter((i) => i.status === "Paid").reduce((s, i) => s + (i.total || 0), 0);

  const tabs = [
    { l: "ทั้งหมด", v: "all" },
    { l: "ฉบับร่าง", v: "Draft" },
    { l: "ค้างชำระ", v: "Pending" },
    { l: "ชำระแล้ว", v: "Paid" },
    { l: "ยกเลิก", v: "Cancelled" },
  ];

  const filtered = tab === "all" ? invoices : invoices.filter((i) => i.status === tab);

  const handleSave = async () => {
    if (!form.pet_name || !form.total) return;
    const invNum = `INV-${moment().format("YYYYMMDD")}-${String(invoices.length + 1).padStart(3, "0")}`;
    try {
      await base44.entities.Invoice.create({ ...form, invoice_number: invNum, status: "Draft" });
      setShowAdd(false);
      setForm({ pet_name: "", owner_name: "", total: 0, notes: "" });
      load();
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    const update = { status };
    if (status === "Paid") update.paid_date = moment().format("YYYY-MM-DD");
    try { await base44.entities.Invoice.update(id, update); load(); } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">ใบเสร็จ</h1><p className="text-muted-foreground text-sm">จัดการการเงินและใบเสร็จ</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />สร้างใบเสร็จ</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard icon={AlertCircle} label="ค้างชำระ" value={formatBaht(pendingAmount)} color="red" />
        <KPICard icon={Banknote} label="รายได้เดือนนี้" value={formatBaht(monthRevenue)} color="emerald" />
        <KPICard icon={Receipt} label="ใบเสร็จเดือนนี้" value={thisMonth.length} color="blue" />
      </div>

      <div className="flex gap-1 flex-wrap">
        {tabs.map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)} className={`px-4 py-2 text-sm rounded-lg ${tab === t.v ? "bg-primary text-white" : "bg-white border hover:bg-muted"}`}>
            {t.l} {t.v !== "all" && <span className="ml-1 text-xs opacity-70">({invoices.filter(i => t.v === "all" ? true : i.status === t.v).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="ไม่มีใบเสร็จ" description="สร้างใบเสร็จใหม่เพื่อเริ่มต้น" action={<Button onClick={() => setShowAdd(true)}>สร้างใบเสร็จ</Button>} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 text-left">
              <th className="p-3 font-medium">เลขที่</th>
              <th className="p-3 font-medium">สัตว์เลี้ยง</th>
              <th className="p-3 font-medium hidden md:table-cell">เจ้าของ</th>
              <th className="p-3 font-medium text-right">ยอดรวม</th>
              <th className="p-3 font-medium">สถานะ</th>
              <th className="p-3 font-medium">จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.map((inv) => {
                const sc = { Draft: "bg-gray-100 text-gray-700", Pending: "bg-amber-100 text-amber-700", Paid: "bg-emerald-100 text-emerald-700", Cancelled: "bg-red-100 text-red-700" };
                const sl = { Draft: "ฉบับร่าง", Pending: "ค้างชำระ", Paid: "ชำระแล้ว", Cancelled: "ยกเลิก" };
                return (
                  <tr key={inv.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{inv.invoice_number || "-"}</td>
                    <td className="p-3 font-medium">{inv.pet_name}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{inv.owner_name}</td>
                    <td className="p-3 text-right font-semibold">{formatBaht(inv.total)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${sc[inv.status]}`}>{sl[inv.status]}</span></td>
                    <td className="p-3">
                      {inv.status !== "Paid" && inv.status !== "Cancelled" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleStatusChange(inv.id, "Paid")} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">ชำระแล้ว</button>
                          <button onClick={() => handleStatusChange(inv.id, "Cancelled")} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">ยกเลิก</button>
                        </div>
                      )}
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
          <DialogHeader><DialogTitle>สร้างใบเสร็จ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.pet_name} onChange={(e) => setForm({...form, pet_name: e.target.value})} /></div>
            <div><Label>ชื่อเจ้าของ *</Label><Input value={form.owner_name} onChange={(e) => setForm({...form, owner_name: e.target.value})} /></div>
            <div><Label>ยอดรวม (฿) *</Label><Input type="number" value={form.total} onChange={(e) => setForm({...form, total: Number(e.target.value)})} /></div>
            <div><Label>หมายเหตุ</Label><Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full">บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}