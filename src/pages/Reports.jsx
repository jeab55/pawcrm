import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Banknote, Users, Ticket, TrendingUp } from "lucide-react";
import KPICard from "@/components/shared/KPICard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import moment from "moment";

const formatBaht = (n) => `฿${(n || 0).toLocaleString()}`;
const COLORS = ["hsl(152,60%,36%)", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [inv, appt, pet] = await Promise.all([
          base44.entities.Invoice.filter({}, "-created_date", 500),
          base44.entities.Appointment.filter({}, "-date", 500),
          base44.entities.Pet.filter({}, "-created_date", 500),
        ]);
        setInvoices(inv); setAppointments(appt); setPets(pet);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const getDays = () => { if (range === "30") return 30; if (range === "90") return 90; return moment().dayOfYear(); };
  const startDate = moment().subtract(getDays(), "days");

  const filteredInv = invoices.filter((i) => i.status === "Paid" && moment(i.paid_date || i.created_date).isAfter(startDate));
  const filteredAppts = appointments.filter((a) => moment(a.date).isAfter(startDate));

  const totalRevenue = filteredInv.reduce((s, i) => s + (i.total || 0), 0);
  const totalVisits = filteredAppts.length;
  const avgTicket = totalVisits > 0 ? Math.round(totalRevenue / totalVisits) : 0;
  const uniqueOwners = new Set(filteredAppts.map((a) => a.owner_name)).size;

  // Revenue by category (appointment type)
  const revenueByType = {};
  filteredAppts.forEach((a) => { revenueByType[a.type] = (revenueByType[a.type] || 0) + 1; });
  const typeData = Object.entries(revenueByType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Popular breeds
  const breedCount = {};
  pets.forEach((p) => { const b = p.breed || "ไม่ระบุ"; breedCount[b] = (breedCount[b] || 0) + 1; });
  const breedData = Object.entries(breedCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);

  // Daily revenue chart
  const days = getDays();
  const dailyRev = [];
  for (let i = Math.min(days - 1, 29); i >= 0; i--) {
    const d = moment().subtract(i, "days");
    const dayStr = d.format("YYYY-MM-DD");
    const rev = filteredInv
      .filter((inv) => moment(inv.paid_date || inv.created_date).format("YYYY-MM-DD") === dayStr)
      .reduce((s, inv) => s + (inv.total || 0), 0);
    dailyRev.push({ date: d.format("D/M"), revenue: rev });
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">รายงาน & Analytics</h1><p className="text-muted-foreground text-sm">วิเคราะห์ผลการดำเนินงาน</p></div>
        <div className="flex gap-1">
          {[{ l: "30 วัน", v: "30" }, { l: "90 วัน", v: "90" }, { l: "ปีนี้", v: "year" }].map((r) => (
            <button key={r.v} onClick={() => setRange(r.v)} className={`px-4 py-2 text-sm rounded-lg ${range === r.v ? "bg-primary text-white" : "bg-white border hover:bg-muted"}`}>{r.l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Banknote} label="รายได้รวม" value={formatBaht(totalRevenue)} color="emerald" />
        <KPICard icon={BarChart3} label="จำนวน Visit" value={totalVisits} color="blue" />
        <KPICard icon={Ticket} label="Average Ticket" value={formatBaht(avgTicket)} color="purple" />
        <KPICard icon={Users} label="Client Retention" value={uniqueOwners} sub="เจ้าของที่มาใช้บริการ" color="primary" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">รายได้รายวัน</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dailyRev}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
            <Tooltip formatter={(v) => [formatBaht(v), "รายได้"]} />
            <Bar dataKey="revenue" fill="hsl(152,60%,36%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service popularity */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">บริการยอดนิยม</h2>
          {typeData.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">ยังไม่มีข้อมูล</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Popular breeds */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">สายพันธุ์ที่มาบ่อย</h2>
          {breedData.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">ยังไม่มีข้อมูล</p> : (
            <div className="space-y-3">
              {breedData.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-24 truncate">{b.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div className="h-full rounded-full flex items-center pl-2 text-xs text-white font-medium" style={{ width: `${Math.max((b.value / breedData[0].value) * 100, 15)}%`, backgroundColor: COLORS[i % COLORS.length] }}>
                      {b.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}