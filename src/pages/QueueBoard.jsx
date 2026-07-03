import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Stethoscope, Pill, CheckCircle, Tv } from "lucide-react";
import moment from "moment";

const columns = [
  { key: "Waiting", label: "รอตรวจ", icon: Clock, color: "amber" },
  { key: "In Exam", label: "กำลังตรวจ", icon: Stethoscope, color: "blue" },
  { key: "Pharmacy Pending", label: "รอจ่ายยา", icon: Pill, color: "purple" },
  { key: "Completed", label: "เสร็จสิ้น", icon: CheckCircle, color: "green" },
];

const colorMap = {
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700", header: "text-amber-700" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", badge: "bg-blue-100 text-blue-700", header: "text-blue-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700", header: "text-purple-700" },
  green: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600", badge: "bg-green-100 text-green-700", header: "text-green-700" },
};

export default function QueueBoard() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(moment());

  const loadVisits = async () => {
    try {
      const all = await base44.entities.Visit.list("-created_date", 200);
      const today = moment().format("YYYY-MM-DD");
      setVisits(all.filter((v) => moment(v.created_date).format("YYYY-MM-DD") === today));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
    const unsub = base44.entities.Visit.subscribe(() => loadVisits());
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Tv className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">บอร์ดคิวผู้ป่วย</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary tabular-nums">{currentTime.format("HH:mm:ss")}</div>
          <div className="text-sm text-muted-foreground">{currentTime.format("dddd D MMMM YYYY")}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const c = colorMap[col.color];
          const items = visits.filter((v) => v.status === col.key);
          return (
            <Card key={col.key} className={`${c.border}`}>
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${c.border}`}>
                  <div className={`w-8 h-8 rounded-lg ${c.badge} flex items-center justify-center`}>
                    <col.icon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${c.header}`}>{col.label}</div>
                    <div className="text-xs text-muted-foreground">{items.length} ราย</div>
                  </div>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {loading ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">กำลังโหลด...</div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">—</div>
                  ) : (
                    items.map((v) => (
                      <div key={v.id} className={`p-3 rounded-lg ${c.bg} border ${c.border}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded ${c.badge} font-bold text-sm flex items-center justify-center flex-shrink-0`}>
                            {v.queue_number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{v.pet_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{v.owner_name}</div>
                          </div>
                        </div>
                        {v.check_in_time && (
                          <div className="text-xs text-muted-foreground mt-1.5">
                            เช็คอิน {moment(v.check_in_time).format("HH:mm")}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}