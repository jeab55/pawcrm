import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, PawPrint, CalendarDays, Syringe,
  Package, Receipt, ShieldCheck, BarChart3, Settings, LogOut, Plus,
  ClipboardList, Stethoscope, Pill, Tv, Users, UserCog, CalendarClock, UsersRound
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const menuItems = [
  { label: "แดชบอร์ด", icon: LayoutDashboard, path: "/" },
  { label: "จองคิว", icon: CalendarClock, path: "/queue-bookings" },
  { label: "บอร์ดคิว", icon: Tv, path: "/queue-board" },
  { label: "เคาน์เตอร์", icon: ClipboardList, path: "/counter" },
  { label: "ห้องตรวจ", icon: Stethoscope, path: "/exam-room" },
  { label: "ห้องยา", icon: Pill, path: "/pharmacy" },
  { label: "สัตว์เลี้ยง", icon: PawPrint, path: "/pets" },
  { label: "เจ้าของ", icon: Users, path: "/owners" },
  { label: "สัตวแพทย์", icon: UserCog, path: "/veterinarians" },
  { label: "นัดหมาย", icon: CalendarDays, path: "/appointments" },
  { label: "วัคซีน", icon: Syringe, path: "/vaccinations" },
  { label: "สต็อกยา", icon: Package, path: "/inventory" },
  { label: "ใบเสร็จ", icon: Receipt, path: "/billing" },
  { label: "ประกัน", icon: ShieldCheck, path: "/insurance" },
  { label: "รายงาน", icon: BarChart3, path: "/reports" },
  { label: "พนักงาน", icon: UsersRound, path: "/staff" },
  { label: "ตั้งค่า", icon: Settings, path: "/settings" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <aside className={`fixed top-0 left-0 h-full z-40 bg-[hsl(152,55%,22%)] text-white flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <PawPrint className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="text-lg font-bold tracking-tight">PawCRM</span>}
      </div>

      {/* New Appointment Button */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <Link
            to="/counter"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>+ เช็คอินผู้ป่วย</span>
          </Link>
        </div>
      )}
      {collapsed && (
        <div className="px-2 pt-4 pb-2">
          <Link
            to="/counter"
            className="flex items-center justify-center w-full p-2.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 pt-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}