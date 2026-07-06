import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Filter } from "lucide-react";

const colorMap = {
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  pink: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  teal: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

// bookings: today's bookings (already filtered to a single date). vets: active vets.
export default function VetScheduleToday({ vets, bookings, onFilterVet }) {
  const activeBookings = bookings.filter((b) => b.status !== "Cancelled" && b.status !== "No Show");

  return (
    <div>
      <h2 className="font-semibold flex items-center gap-2 mb-3">
        <Stethoscope className="w-5 h-5 text-primary" />ตารางหมอวันนี้
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vets.map((vet) => {
          const c = colorMap[vet.color] || colorMap.green;
          const list = activeBookings
            .filter((b) => b.veterinarian_id === vet.id)
            .sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || ""));
          return (
            <Card key={vet.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-sm font-bold flex-shrink-0`}>{vet.name?.[0]}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{vet.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{vet.specialization}</div>
                    </div>
                  </div>
                  <Badge className={`${c.bg} ${c.text}`} variant="outline">{list.length} คิว</Badge>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">ยังไม่มีคิวจองวันนี้</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {list.map((b) => (
                      <div key={b.id} className="flex items-center gap-2 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
                        <span className="font-medium w-12 flex-shrink-0">{b.booking_time}</span>
                        <span className="truncate">{b.pet_name} <span className="text-muted-foreground text-xs">· {b.service_type}</span></span>
                      </div>
                    ))}
                  </div>
                )}
                {onFilterVet && list.length > 0 && (
                  <button onClick={() => onFilterVet(vet.id)} className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                    <Filter className="w-3 h-3" />ดูเฉพาะหมอท่านนี้
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}