import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Stethoscope, Pill, ArrowRight, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

const rooms = [
  {
    label: "เคาน์เตอร์",
    desc: "เช็คอินผู้ป่วย · ดูคิวจอง · เรียกคิว · รับชำระ",
    path: "/counter",
    icon: ClipboardList,
    accent: "from-emerald-500 to-green-600",
    ring: "hover:border-emerald-400",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "ห้องตรวจ",
    desc: "เรียกคิวรอตรวจ · บันทึกวินิจฉัย · สั่งยาส่งห้องยา",
    path: "/exam-room",
    icon: Stethoscope,
    accent: "from-teal-500 to-emerald-600",
    ring: "hover:border-teal-400",
    iconBg: "bg-teal-100 text-teal-700",
  },
  {
    label: "ห้องยา",
    desc: "ดูรายการรอจัดยา/จ่ายยา · ทำเครื่องหมายจ่ายแล้ว",
    path: "/pharmacy",
    icon: Pill,
    accent: "from-purple-500 to-fuchsia-600",
    ring: "hover:border-purple-400",
    iconBg: "bg-purple-100 text-purple-700",
  },
];

export default function RoomSwitcher() {
  const [activeStaff, setActiveStaff] = useState(null);

  useEffect(() => {
    base44.entities.Staff.list("-created_date", 300)
      .then((all) => setActiveStaff(all.filter((s) => s.active !== false).length))
      .catch(() => setActiveStaff(null));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">เลือกจุดงาน</h2>
        {activeStaff !== null && (
          <Link to="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5">
            <Users className="w-4 h-4" />พนักงานพร้อมทำงาน {activeStaff} คน
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <Link
            key={r.path}
            to={r.path}
            className={`group relative overflow-hidden rounded-2xl border-2 border-transparent bg-white p-5 shadow-sm transition-all ${r.ring} hover:shadow-md`}
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${r.accent}`} />
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${r.iconBg}`}>
                <r.icon className="w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-lg font-bold">
                  {r.label}
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">{r.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}