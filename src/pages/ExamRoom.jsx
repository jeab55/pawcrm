import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Pill, Plus, Trash2, Check, UserCheck, PawPrint } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";
import EmptyState from "@/components/shared/EmptyState";

export default function ExamRoom() {
  const [visits, setVisits] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [vetName, setVetName] = useState("");
  const [vetId, setVetId] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [medSearch, setMedSearch] = useState("");
  const [showMedPicker, setShowMedPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const all = await base44.entities.Visit.list("-created_date", 200);
      const today = moment().format("YYYY-MM-DD");
      setVisits(all.filter((v) => moment(v.created_date).format("YYYY-MM-DD") === today));
      const meds = await base44.entities.InventoryItem.list("-created_date", 100);
      setInventory(meds.filter((m) => m.quantity > 0));
      const vetList = await base44.entities.Veterinarian.list("-created_date", 100);
      setVets(vetList.filter((v) => v.status === "Active"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = base44.entities.Visit.subscribe(() => loadData());
    return unsub;
  }, []);

  const waitingVisits = visits.filter((v) => v.status === "Waiting");
  const inExamVisits = visits.filter((v) => v.status === "In Exam");

  const handleCallNext = async (visit) => {
    try {
      await base44.entities.Visit.update(visit.id, {
        status: "In Exam",
        exam_start_time: new Date().toISOString(),
      });
      setCurrentVisit(visit);
      setDiagnosis(visit.diagnosis || "");
      setTreatment(visit.treatment || "");
      setVetName(visit.vet_name || "");
      setVetId(visit.vet_id || "");
      setPrescriptions(visit.prescriptions || []);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCurrent = (visit) => {
    setCurrentVisit(visit);
    setDiagnosis(visit.diagnosis || "");
    setTreatment(visit.treatment || "");
    setVetName(visit.vet_name || "");
    setVetId(visit.vet_id || "");
    setPrescriptions(visit.prescriptions || []);
  };

  const addPrescription = (item) => {
    setPrescriptions([
      ...prescriptions,
      {
        inventory_item_id: item.id,
        name: item.name,
        sku: item.sku || "",
        qty: 1,
        unit: item.unit || "เม็ด",
        notes: "",
      },
    ]);
    setShowMedPicker(false);
    setMedSearch("");
  };

  const updatePrescription = (idx, field, value) => {
    const updated = [...prescriptions];
    updated[idx] = { ...updated[idx], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (idx) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleSaveExam = async (withMeds) => {
    if (!currentVisit) return;
    setSaving(true);
    try {
      const updateData = {
        diagnosis,
        treatment,
        vet_name: vetName || undefined,
        vet_id: vetId || undefined,
        prescriptions: prescriptions.length > 0 ? prescriptions : undefined,
        has_meds: prescriptions.length > 0,
        status: withMeds ? "Pharmacy Pending" : "Completed",
        completed_time: !withMeds ? new Date().toISOString() : undefined,
      };
      await base44.entities.Visit.update(currentVisit.id, updateData);
      setCurrentVisit(null);
      setDiagnosis("");
      setTreatment("");
      setVetId("");
      setPrescriptions([]);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredMeds = inventory.filter((m) =>
    m.name?.toLowerCase().includes(medSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ห้องตรวจ</h1>
        <p className="text-muted-foreground text-sm mt-1">เรียกคิว บันทึกตรวจ วินิจฉัย และสั่งยา</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Patient queue sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                กำลังตรวจ ({inExamVisits.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inExamVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">ยังไม่มีผู้ป่วยในห้องตรวจ</p>
              ) : (
                inExamVisits.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectCurrent(v)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentVisit?.id === v.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                        {v.queue_number}
                      </span>
                      <span className="font-medium text-sm">{v.pet_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{v.owner_name}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-amber-500" />
                รอตรวจ ({waitingVisits.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-3">กำลังโหลด...</p>
              ) : waitingVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">ไม่มีคิวรอ</p>
              ) : (
                waitingVisits.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleCallNext(v)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center">
                          {v.queue_number}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{v.pet_name}</div>
                          <div className="text-xs text-muted-foreground">{v.owner_name}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        เรียก
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exam form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              {currentVisit ? `กำลังตรวจ: ${currentVisit.pet_name}` : "กรุณาเลือก/เรียกคิวจากแผงซ้าย"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!currentVisit ? (
              <EmptyState
                title="ยังไม่ได้เลือกผู้ป่วย"
                description="กดปุ่ม 'เรียก' หรือเลือกผู้ป่วยที่กำลังตรวจจากแผงด้านซ้าย"
                icon={Stethoscope}
              />
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-accent/50">
                  <div>
                    <div className="text-xs text-muted-foreground">เลขคิว</div>
                    <div className="font-bold text-lg">{currentVisit.queue_number}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ชื่อสัตว์</div>
                    <div className="font-medium">{currentVisit.pet_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">เจ้าของ</div>
                    <div className="font-medium">{currentVisit.owner_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ชนิด</div>
                    <div className="font-medium">{currentVisit.species || "-"}</div>
                  </div>
                </div>

                {currentVisit.reason && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-1">อาการที่มาพบ</div>
                    <div className="text-sm">{currentVisit.reason}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>สัตวแพทย์</Label>
                  <Select value={vetId} onValueChange={(v) => { setVetId(v); const vet = vets.find((x) => x.id === v); setVetName(vet?.name || ""); }}>
                    <SelectTrigger><SelectValue placeholder="เลือกแพทย์" /></SelectTrigger>
                    <SelectContent>
                      {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>การวินิจฉัย</Label>
                  <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="ผลการตรวจ วินิจฉัยโรค..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>การรักษา / คำแนะนำ</Label>
                  <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="แผนการรักษา คำแนะนำ..." rows={3} />
                </div>

                {/* Prescriptions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-purple-500" />
                      สั่งยา ({prescriptions.length})
                    </Label>
                    <Button variant="outline" size="sm" onClick={() => setShowMedPicker(!showMedPicker)}>
                      <Plus className="w-4 h-4" /> เพิ่มยา
                    </Button>
                  </div>

                  {showMedPicker && (
                    <div className="p-3 rounded-lg border border-border bg-accent/30 space-y-2">
                      <Input value={medSearch} onChange={(e) => setMedSearch(e.target.value)} placeholder="ค้นหายาในคลัง..." autoFocus />
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredMeds.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => addPrescription(m)}
                            className="w-full text-left p-2 rounded hover:bg-accent text-sm flex items-center justify-between"
                          >
                            <span className="font-medium">{m.name}</span>
                            <span className="text-muted-foreground text-xs">คงเหลือ {m.quantity} {m.unit}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {prescriptions.length > 0 && (
                    <div className="space-y-2">
                      {prescriptions.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.sku}</div>
                          </div>
                          <Input
                            type="number"
                            value={p.qty}
                            onChange={(e) => updatePrescription(idx, "qty", parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                            min="1"
                          />
                          <Input
                            value={p.unit}
                            onChange={(e) => updatePrescription(idx, "unit", e.target.value)}
                            className="w-20"
                            placeholder="หน่วย"
                          />
                          <Input
                            value={p.notes || ""}
                            onChange={(e) => updatePrescription(idx, "notes", e.target.value)}
                            className="w-32"
                            placeholder="หมายเหตุ"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removePrescription(idx)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 border-t">
                  <Button
                    onClick={() => handleSaveExam(true)}
                    disabled={saving || prescriptions.length === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Pill className="w-4 h-4" />
                    บันทึก + ส่งห้องยา
                  </Button>
                  <Button
                    onClick={() => handleSaveExam(false)}
                    disabled={saving}
                    variant="outline"
                    className="flex-1"
                  >
                    <Check className="w-4 h-4" />
                    บันทึก + จบกระบวนการ
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}