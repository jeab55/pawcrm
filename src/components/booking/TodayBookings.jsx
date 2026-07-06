import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, LogIn, Phone } from "lucide-react";
import moment from "moment";
import EmptyState from "@/components/shared/EmptyState";
import { checkInBooking, todayVisitsFilter } from "@/lib/checkInBooking";

// Shows today's Booked/Confirmed bookings and lets the counter check them in.
export default function TodayBookings({ onCheckedIn }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState(null);

  const load = async () => {
    try {
      const today = moment().format("YYYY-MM-DD");
      const all = await base44.entities.QueueBooking.filter({ booking_date: today }, "booking_time", 100);
      setBookings(all.filter((b) => b.status === "Booked" || b.status === "Confirmed"));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.QueueBooking.subscribe(() => load());
    return unsub;
  }, []);

  const handleCheckIn = async (booking) => {
    setCheckingId(booking.id);
    try {
      const all = await base44.entities.Visit.list("-created_date", 200);
      await checkInBooking(booking, todayVisitsFilter(all));
      await load();
      onCheckedIn?.();
    } catch (e) { console.error(e); }
    setCheckingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          คิวจองวันนี้ ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
        ) : bookings.length === 0 ? (
          <EmptyState title="ไม่มีคิวจองวันนี้" description="การจองล่วงหน้าสำหรับวันนี้จะแสดงที่นี่" icon={CalendarClock} />
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="text-center flex-shrink-0">
                  <div className="text-xs text-muted-foreground">เวลา</div>
                  <div className="text-sm font-semibold">{b.booking_time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{b.pet_name} <span className="text-xs text-muted-foreground">· {b.service_type}</span></div>
                  <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    {b.owner_name} <Phone className="w-3 h-3" /> {b.owner_phone}
                  </div>
                </div>
                <Badge variant="outline" className={b.status === "Confirmed" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                  {b.status === "Confirmed" ? "ยืนยันแล้ว" : "จองแล้ว"}
                </Badge>
                <Button size="sm" onClick={() => handleCheckIn(b)} disabled={checkingId === b.id}>
                  <LogIn className="w-4 h-4 mr-1" />{checkingId === b.id ? "..." : "เช็คอิน"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}