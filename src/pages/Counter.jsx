import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Clock, PawPrint, Phone } from "lucide-react";
import moment from "moment";
import EmptyState from "@/components/shared/EmptyState";
import TodayBookings from "@/components/booking/TodayBookings";

const statusConfig = {
  "Waiting": { label: "รอตรวจ", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "In Exam": { label: "กำลังตรวจ", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "Pharmacy Pending": { label: "รอจ่ายยา", color: "bg-purple-100 text-purple-700 border-purple-200" },
  "Completed": { label: "เสร็จสิ้น", color: "bg-green-100 text-green-700 border-green-200" },
  "Cancelled": { label: "ยกเลิก", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function Counter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [reason, setReason] = useState("");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

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
    return unsub;
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await base44.entities.Pet.list("-created_date", 100);
      const q = searchQuery.toLowerCase();
      setSearchResults(
        results.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.owner_name?.toLowerCase().includes(q) ||
            p.owner_phone?.includes(q)
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedPet) return;
    setCheckingIn(true);
    try {
      const today = moment().format("YYYY-MM-DD");
      const todayVisits = visits;
      const maxQueue = todayVisits.reduce((max, v) => Math.max(max, v.queue_number || 0), 0);
      await base44.entities.Visit.create({
        queue_number: maxQueue + 1,
        pet_id: selectedPet.id,
        pet_name: selectedPet.name,
        owner_name: selectedPet.owner_name,
        owner_phone: selectedPet.owner_phone,
        species: selectedPet.species,
        status: "Waiting",
        check_in_time: new Date().toISOString(),
        reason: reason || undefined,
        has_meds: false,
        dispensed: false,
      });
      setSelectedPet(null);
      setReason("");
      setSearchQuery("");
      setSearchResults([]);
      await loadVisits();
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingIn(false);
    }
  };

  const activeVisits = visits.filter((v) => v.status !== "Cancelled" && v.status !== "Completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">เคาน์เตอร์ — เช็คอินผู้ป่วย</h1>
        <p className="text-muted-foreground text-sm mt-1">ค้นหาสัตว์เลี้ยงและออกเลขคิว</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-in panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              เช็คอินผู้ป่วยใหม่
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ค้นหาสัตว์เลี้ยง (ชื่อ / เจ้าของ / เบอร์โทร)</Label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="พิมพ์เพื่อค้นหา..."
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searching} variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPet?.id === pet.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{pet.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">{pet.species}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{pet.owner_name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      {pet.owner_phone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedPet && (
              <div className="space-y-4 p-4 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{selectedPet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPet.species} · {selectedPet.owner_name}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>อาการ / เหตุผลที่มาพบแพทย์</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="เช่น ไอ, ท้องเสีย, ตรวจวัคซีน..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCheckIn} disabled={checkingIn} className="w-full">
                  {checkingIn ? "กำลังเช็คอิน..." : "ออกเลขคิว & เช็คอิน"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              คิววันนี้ ({activeVisits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
            ) : activeVisits.length === 0 ? (
              <EmptyState
                title="ยังไม่มีคิววันนี้"
                description="เช็คอินผู้ป่วยที่แผงซ้าย"
                icon={Clock}
              />
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {activeVisits.map((v) => {
                  const sc = statusConfig[v.status] || statusConfig["Waiting"];
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                        {v.queue_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{v.pet_name}</div>
                        <div className="text-sm text-muted-foreground truncate">{v.owner_name}</div>
                      </div>
                      <Badge className={sc.color} variant="outline">
                        {sc.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TodayBookings onCheckedIn={loadVisits} />
    </div>
  );
}