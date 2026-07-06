import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Plus, Search, Phone, Stethoscope, LogIn, CheckCircle2, XCircle } from "lucide-react";
import moment from "moment";
import KPICard from "@/components/shared/KPICard";
import EmptyState from "@/components/shared/EmptyState";
import BookingForm from "@/components/booking/BookingForm";
import { checkInBooking, todayVisitsFilter } from "@/lib/checkInBooking";

const statusConfig = {
  Booked: { label: "จองแล้ว", color: "bg-amber-100 text-amber-700 border-amber-200" },
  Confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "Checked In": { label: "เช็คอินแล้ว", color: "bg-green-100 text-green-700 border-green-200" },
  Cancelled: { label: "ยกเลิก", color: "bg-gray-100 text-gray-500 border-gray-200" },
  "No Show": { label: "ไม่มาตามนัด", color: "bg-red-100 text-red-700 border-red-200" },
};
const sourceLabels = { Phone: "โทรศัพท์", "Walk-in": "หน้าร้าน", LINE: "LINE", Online: "ออนไลน์" };
const statusList = ["Booked", "Confirmed", "Checked In", "Cancelled", "No Show"];

export default function QueueBookings() {
  const [bookings, setBookings] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVet, setFilterVet] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const all = await base44.entities.QueueBooking.list("-booking_date", 500);
      setBookings(all);
      const vetList = await base44.entities.Veterinarian.list("-created_date", 100);
      setVets(vetList.filter((v) => v.status === "Active"));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.QueueBooking.subscribe(() => load());
    return unsub;
  }, []);

  const today = moment().format("YYYY-MM-DD");
  const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
  const todayCount = bookings.filter((b) => b.booking_date === today && b.status !== "Cancelled").length;
  const tomorrowCount = bookings.filter((b) => b.booking_date === tomorrow && b.status !== "Cancelled").length;
  const bookedCount = bookings.filter((b) => b.status === "Booked" || b.status === "Confirmed").length;
  const checkedInCount = bookings.filter((b) => b.status === "Checked In").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter((b) => (filterDate ? b.booking_date === filterDate : true))
      .filter((b) => (filterStatus === "all" ? true : b.status === filterStatus))
      .filter((b) => (filterVet === "all" ? true : b.veterinarian_id === filterVet))
      .filter((b) => !q || b.pet_name?.toLowerCase().includes(q) || b.owner_name?.toLowerCase().includes(q) || b.owner_phone?.includes(q))
      .sort((a, b) => (a.booking_date + (a.booking_time || "")).localeCompare(b.booking_date + (b.booking_time || "")));
  }, [bookings, filterDate, filterStatus, filterVet, search]);

  const handleCheckIn = async (booking) => {
    setCheckingId(booking.id);
    try {
      const all = await base44.entities.Visit.list("-created_date", 200);
      await checkInBooking(booking, todayVisitsFilter(all));
      await load();
    } catch (e) { console.error(e); }
    setCheckingId(null);
  };

  const updateStatus = async (id, status) => {
    try { await base44.entities.QueueBooking.update(id, { status }); await load(); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarClock className="w-6 h-6 text-primary" />จองคิว</h1>
          <p className="text-muted-foreground text-sm">รับจองคิวล่วงหน้า แล้วเช็คอินเป็นคิวจริงที่เคาน์เตอร์</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />สร้างคิวจอง</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={CalendarClock} label="จองวันนี้" value={todayCount} color="primary" />
        <KPICard icon={CalendarClock} label="จองพรุ่งนี้" value={tomorrowCount} color="blue" />
        <KPICard icon={Stethoscope} label="รอยืนยัน/จองแล้ว" value={bookedCount} color="amber" />
        <KPICard icon={CheckCircle2} label="เช็คอินแล้ว" value={checkedInCount} color="emerald" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อสัตว์ / เจ้าของ / เบอร์โทร" className="pl-9" />
        </div>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="md:w-40" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {statusList.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterVet} onValueChange={setFilterVet}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="สัตวแพทย์" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสัตวแพทย์</SelectItem>
            {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarClock} title="ยังไม่มีคิวจองในช่วงนี้" description="กดปุ่ม “สร้างคิวจอง” ด้านบนขวาเพื่อเพิ่มการจองคิวล่วงหน้า" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 text-left">
                <th className="p-3 font-medium">วันที่ / เวลา</th>
                <th className="p-3 font-medium">สัตว์เลี้ยง</th>
                <th className="p-3 font-medium">เจ้าของ</th>
                <th className="p-3 font-medium">บริการ</th>
                <th className="p-3 font-medium">สัตวแพทย์</th>
                <th className="p-3 font-medium">สถานะ</th>
                <th className="p-3 font-medium text-right">จัดการ</th>
              </tr></thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-muted/20">
                    <td className="p-3"><div className="font-medium">{moment(b.booking_date).format("D MMM")}</div><div className="text-xs text-muted-foreground">{b.booking_time} น.</div></td>
                    <td className="p-3"><div className="font-medium">{b.pet_name}</div><div className="text-xs text-muted-foreground">{[b.species, b.breed].filter(Boolean).join(" • ")}</div></td>
                    <td className="p-3"><div>{b.owner_name}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{b.owner_phone}</div></td>
                    <td className="p-3">{b.service_type}<div className="text-xs text-muted-foreground">{sourceLabels[b.source] || b.source}</div></td>
                    <td className="p-3 text-muted-foreground">{b.veterinarian_name || "—"}</td>
                    <td className="p-3"><Badge className={statusConfig[b.status]?.color} variant="outline">{statusConfig[b.status]?.label}</Badge></td>
                    <td className="p-3"><div className="flex justify-end gap-1">{renderActions(b)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{b.pet_name}</div>
                    <div className="text-xs text-muted-foreground">{[b.species, b.breed].filter(Boolean).join(" • ")}</div>
                  </div>
                  <Badge className={statusConfig[b.status]?.color} variant="outline">{statusConfig[b.status]?.label}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2"><CalendarClock className="w-4 h-4" />{moment(b.booking_date).format("D MMM")} • {b.booking_time} น.</div>
                <div className="text-sm">{b.owner_name} <span className="text-muted-foreground">· {b.owner_phone}</span></div>
                <div className="text-sm text-muted-foreground">{b.service_type}{b.veterinarian_name ? ` • ${b.veterinarian_name}` : ""}</div>
                <div className="flex gap-2 pt-1">{renderActions(b)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <BookingForm open={showForm} onOpenChange={setShowForm} vets={vets} onSaved={load} />
    </div>
  );

  function renderActions(b) {
    if (b.status === "Cancelled" || b.status === "Checked In" || b.status === "No Show") return null;
    return (
      <>
        {b.status === "Booked" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "Confirmed")}>
            <CheckCircle2 className="w-4 h-4 mr-1" />ยืนยัน
          </Button>
        )}
        <Button size="sm" onClick={() => handleCheckIn(b)} disabled={checkingId === b.id}>
          <LogIn className="w-4 h-4 mr-1" />{checkingId === b.id ? "..." : "เช็คอิน"}
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => updateStatus(b.id, "Cancelled")}>
          <XCircle className="w-4 h-4" />
        </Button>
      </>
    );
  }
}