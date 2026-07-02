import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Banknote, Syringe, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import moment from "moment";

const formatBaht = (n) => `฿${(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [appts, invs, vacs] = await Promise.all([
          base44.entities.Appointment.filter({}, "-date", 200),
          base44.entities.Invoice.filter({}, "-created_date", 200),
          base44.entities.Vaccination.filter({}, "-next_due_date", 200),
        ]);
        setAppointments(appts);
        setInvoices(invs);
        setVaccinations(vacs);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const today = moment().format("YYYY-MM-DD");
  const todayAppts = appointments.filter((a) => a.date === today);
  const doneToday = todayAppts.filter((a) => a.status === "Done").length;

  const last7 = invoices
    .filter((i) => i.status === "Paid" && moment(i.paid_date || i.created_date).isAfter(moment().subtract(7, "days")))
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const upcoming14Vac = vaccinations.filter((v) => {
    if (!v.next_due_date) return false;
    const d = moment(v.next_due_date);
    return d.isAfter(moment()) && d.isBefore(moment().add(14, "days"));
  }).length;

  const pendingAmount = invoices
    .filter((i) => i.status === "Pending" || i.status === "Draft")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  // Revenue chart data
  const getDays = () => {
    if (range === "30") return 30;
    if (range === "90") return 90;
    return moment().dayOfYear();
  };
  const days = getDays();
  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = moment().subtract(i, "days");
    const dayStr = d.format("YYYY-MM-DD");
    const rev = invoices
      .filter((inv) => inv.status === "Paid" && moment(inv.paid_date || inv.created_date).format("YYYY-MM-DD") === dayStr)
      .reduce((s, inv) => s + (inv.total || 0), 0);
    chartData.push({ date: d.format("D/M"), revenue: rev });
  }

  const alerts = [
    ...vaccinations
      .filter((v) => v.next_due_date && moment(v.next_due_date).isBefore(moment()))
      .slice(0, 3)
      .map((v) => ({ text: `${v.pet_name} — วัคซีน${v.vaccine_name}เกินกำหนด`, type: "warning" })),
    ...invoices
      .filter((i) => i.status === "Pending")
      .slice(0, 3)
      .map((i) => ({ text: `${i.owner_name} — ค้างชำระ ${formatBaht(i.total)}`, type: "danger" })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground text-sm">ภาพรวมคลินิกวันนี้</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={CalendarDays} label="นัดหมายวันนี้" value={todayAppts.length} sub={`เสร็จ ${doneToday} / เหลือ ${todayAppts.length - doneToday}`} color="primary" />
        <KPICard icon={Banknote} label="รายได้ 7 วัน" value={formatBaht(last7)} color="emerald" />
        <KPICard icon={Syringe} label="วัคซีนใกล้กำหนด" value={upcoming14Vac} sub="ภายใน 14 วัน" color="amber" />
        <KPICard icon={AlertCircle} label="ค้างชำระ" value={formatBaht(pendingAmount)} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's appointments */}
        <div className="bg-white rounded-xl border p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">นัดหมายวันนี้</h2>
            <Link to="/appointments" className="text-primary text-sm hover:underline flex items-center gap-1">ดูทั้งหมด <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">ไม่มีนัดหมายวันนี้</div>
          ) : (
            <div className="space-y-3">
              {todayAppts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">เวลา</p>
                    <p className="text-sm font-semibold">{a.time_slot}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.pet_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.type} • {a.owner_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    a.status === "Done" ? "bg-emerald-100 text-emerald-700"
                    : a.status === "In Progress" ? "bg-blue-100 text-blue-700"
                    : a.status === "No-show" ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">รายได้รายวัน</h2>
            <div className="flex gap-1">
              {[{ l: "30 วัน", v: "30" }, { l: "90 วัน", v: "90" }, { l: "ปีนี้", v: "year" }].map((r) => (
                <button key={r.v} onClick={() => setRange(r.v)} className={`px-3 py-1 text-xs rounded-lg transition-colors ${range === r.v ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {r.l}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152,60%,36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152,60%,36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(Math.floor(chartData.length / 8), 0)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
              <Tooltip formatter={(v) => [`฿${v.toLocaleString()}`, "รายได้"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(152,60%,36%)" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">การแจ้งเตือน</h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${a.type === "danger" ? "bg-red-50" : "bg-amber-50"}`}>
                <AlertCircle className={`w-4 h-4 flex-shrink-0 ${a.type === "danger" ? "text-red-500" : "text-amber-500"}`} />
                <p className="text-sm">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}