import React from "react";
import { UserCircle2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { colorClass, roleLabel } from "@/lib/staff";

/**
 * Small bar shown at the top of a station page (Counter / Exam / Pharmacy).
 * Lets the operator pick who is working at THIS station on THIS device.
 */
export default function StationStaffBar({ label, staffList, selected, onSelect, loading }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-2.5">
      <UserCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-auto flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
            {selected ? (
              <>
                <Badge variant="outline" className={colorClass(selected.color)}>
                  {selected.nickname || selected.full_name}
                </Badge>
                <span className="text-xs text-muted-foreground">{roleLabel(selected.role)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">ไม่ระบุ — เลือกพนักงาน</span>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onSelect(null)} className="text-muted-foreground">
            ไม่ระบุ
          </DropdownMenuItem>
          {loading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">กำลังโหลด...</div>
          ) : staffList.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">ยังไม่มีพนักงานในบทบาทนี้</div>
          ) : (
            staffList.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => onSelect(s)} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colorClass(s.color).split(" ")[0]}`} />
                <span className="flex-1">{s.nickname || s.full_name}</span>
                <span className="text-xs text-muted-foreground">{roleLabel(s.role)}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}