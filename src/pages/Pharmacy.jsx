import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, CheckCircle, Package, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import moment from "moment";
import EmptyState from "@/components/shared/EmptyState";
import StationStaffBar from "@/components/staff/StationStaffBar";
import { useStationStaff } from "@/hooks/useStationStaff";

export default function Pharmacy() {
  const { staffList, selected: staff, select, loading: staffLoading } = useStationStaff("pharmacy", ["pharmacy", "assistant", "admin"]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [dispensing, setDispensing] = useState(null);

  const loadVisits = async () => {
    try {
      const all = await base44.entities.Visit.list("-created_date", 200);
      setVisits(all.filter((v) => v.status === "Pharmacy Pending" || v.status === "Completed"));
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

  const pending = visits.filter((v) => v.status === "Pharmacy Pending");
  const completed = visits.filter((v) => v.status === "Completed" && v.dispensed);

  const handleDispense = async (visit) => {
    setDispensing(visit.id);
    try {
      for (const rx of visit.prescriptions || []) {
        if (!rx.inventory_item_id) continue;
        const item = await base44.entities.InventoryItem.get(rx.inventory_item_id);
        const newQty = Math.max(0, (item.quantity || 0) - rx.qty);
        await base44.entities.InventoryItem.update(rx.inventory_item_id, { quantity: newQty });
      }
      await base44.entities.Visit.update(visit.id, {
        status: "Completed",
        dispensed: true,
        completed_time: new Date().toISOString(),
        dispensed_by: staff ? (staff.nickname || staff.full_name) : undefined,
      });
      await loadVisits();
    } catch (e) {
      console.error(e);
    } finally {
      setDispensing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ห้องยา</h1>
        <p className="text-muted-foreground text-sm mt-1">รายการรอจ่ายยา — กดจ่ายยาเพื่อตัดสต็อกอัตโนมัติ</p>
      </div>

      <StationStaffBar label="ผู้จ่ายยาประจำจุด (จ่ายยาโดย)" staffList={staffList} selected={staff} onSelect={select} loading={staffLoading} />

      {/* Pending section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-500" />
            รอจ่ายยา ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
          ) : pending.length === 0 ? (
            <EmptyState
              title="ไม่มีรายการรอจ่ายยา"
              description="เมื่อห้องตรวจสั่งยา รายการจะปรากฏที่นี่"
              icon={ClipboardList}
            />
          ) : (
            <div className="space-y-3">
              {pending.map((v) => {
                const isExpanded = expandedId === v.id;
                return (
                  <div key={v.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                        {v.queue_number}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium">{v.pet_name}</div>
                        <div className="text-sm text-muted-foreground">{v.owner_name} · {v.vet_name || "-"}</div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700" variant="outline">
                        {v.prescriptions?.length || 0} รายการยา
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-accent/20 p-4 space-y-3">
                        {v.diagnosis && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">วินิจฉัย: </span>
                            <span className="font-medium">{v.diagnosis}</span>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> รายการยาที่สั่ง
                          </div>
                          {v.prescriptions?.map((rx, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded bg-background border border-border">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{rx.name}</div>
                                {rx.notes && <div className="text-xs text-muted-foreground">{rx.notes}</div>}
                              </div>
                              <Badge variant="outline" className="bg-primary/5">
                                {rx.qty} {rx.unit}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleDispense(v)}
                          disabled={dispensing === v.id}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {dispensing === v.id ? (
                            <>กำลังจ่ายยาและตัดสต็อก...</>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              จ่ายยาและตัดสต็อก
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed today */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              จ่ายยาเสร็จสิ้น ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completed.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {v.queue_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{v.pet_name}</div>
                    <div className="text-xs text-muted-foreground">{v.owner_name}{v.dispensed_by ? ` · จ่ายโดย ${v.dispensed_by}` : ""}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {v.completed_time ? moment(v.completed_time).format("HH:mm") : ""}
                  </div>
                  <Badge className="bg-green-100 text-green-700" variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1" /> จ่ายแล้ว
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}