import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Plus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/shared/EmptyState";
import moment from "moment";

const categories = ["ยา", "วัคซีน", "อุปกรณ์", "อาหาร", "อื่นๆ"];
const formatBaht = (n) => `฿${(n || 0).toLocaleString()}`;

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "ยา", unit: "", quantity: 0, min_quantity: 10, cost_price: 0, sell_price: 0, expiry_date: "", supplier: "", is_controlled: false });

  const load = async () => {
    try { setItems(await base44.entities.InventoryItem.filter({}, "-created_date", 500)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totalValue = items.reduce((s, i) => s + (i.quantity || 0) * (i.sell_price || 0), 0);

  const getStatus = (item) => {
    if (item.quantity === 0) return "หมดสต็อก";
    if (item.quantity <= item.min_quantity) return "ใกล้หมด";
    if (item.expiry_date && moment(item.expiry_date).isBefore(moment().add(30, "days"))) return "ใกล้หมดอายุ";
    if (item.is_controlled) return "Controlled";
    return "ปกติ";
  };

  const filtered = items.filter((i) => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (filterStatus !== "all") {
      const st = getStatus(i);
      if (filterStatus === "low" && st !== "ใกล้หมด") return false;
      if (filterStatus === "out" && st !== "หมดสต็อก") return false;
      if (filterStatus === "expiring" && st !== "ใกล้หมดอายุ") return false;
      if (filterStatus === "controlled" && !i.is_controlled) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return i.name?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.name) return;
    try {
      await base44.entities.InventoryItem.create(form);
      setShowAdd(false);
      setForm({ name: "", sku: "", category: "ยา", unit: "", quantity: 0, min_quantity: 10, cost_price: 0, sell_price: 0, expiry_date: "", supplier: "", is_controlled: false });
      load();
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">สต็อกยา & อุปกรณ์</h1>
          <p className="text-muted-foreground text-sm">{items.length} รายการ • มูลค่ารวม {formatBaht(totalValue)}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />เพิ่มรายการ</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อยา / SKU" className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-36"><SelectValue placeholder="หมวดหมู่" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวด</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="low">ใกล้หมด</SelectItem>
            <SelectItem value="out">หมดสต็อก</SelectItem>
            <SelectItem value="expiring">ใกล้หมดอายุ</SelectItem>
            <SelectItem value="controlled">Controlled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="ไม่มีรายการ" description="เพิ่มยาหรืออุปกรณ์เพื่อเริ่มจัดการสต็อก" action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />เพิ่มรายการ</Button>} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 text-left">
              <th className="p-3 font-medium">ชื่อ</th>
              <th className="p-3 font-medium hidden md:table-cell">SKU</th>
              <th className="p-3 font-medium">หมวด</th>
              <th className="p-3 font-medium text-right">คงเหลือ</th>
              <th className="p-3 font-medium text-right hidden md:table-cell">ราคาขาย</th>
              <th className="p-3 font-medium">สถานะ</th>
            </tr></thead>
            <tbody>
              {filtered.map((item) => {
                const st = getStatus(item);
                const stColor = st === "หมดสต็อก" ? "bg-red-100 text-red-700" : st === "ใกล้หมด" ? "bg-amber-100 text-amber-700" : st === "ใกล้หมดอายุ" ? "bg-orange-100 text-orange-700" : st === "Controlled" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700";
                return (
                  <tr key={item.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{item.sku || "-"}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                    <td className="p-3 text-right hidden md:table-cell">{formatBaht(item.sell_price)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${stColor}`}>{st}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มยา / อุปกรณ์</DialogTitle>
            <DialogDescription>เพิ่มรายการยาหรืออุปกรณ์เข้าสต็อก ฟิลด์ที่มี * จำเป็นต้องกรอก</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>ชื่อ *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>หมวดหมู่</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>หน่วย</Label><Input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} placeholder="เช่น เม็ด, ขวด" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>จำนวน</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: Number(e.target.value)})} /></div>
              <div><Label>ต้นทุน (฿)</Label><Input type="number" value={form.cost_price} onChange={(e) => setForm({...form, cost_price: Number(e.target.value)})} /></div>
              <div><Label>ราคาขาย (฿)</Label><Input type="number" value={form.sell_price} onChange={(e) => setForm({...form, sell_price: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>ขั้นต่ำ</Label><Input type="number" value={form.min_quantity} onChange={(e) => setForm({...form, min_quantity: Number(e.target.value)})} /></div>
              <div><Label>หมดอายุ</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})} /></div>
            </div>
            <div><Label>ผู้จำหน่าย</Label><Input value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_controlled} onCheckedChange={(v) => setForm({...form, is_controlled: v})} />
              <Label>ยาควบคุม</Label>
            </div>
            <Button onClick={handleSave} className="w-full">บันทึก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}