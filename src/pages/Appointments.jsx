import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import moment from "moment";

const TIME_SLOTS = [];
for (let h = 9; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17 || true) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
const FILTERED_SLOTS = TIME_SLOTS.filter(s => s <= "17:30");

const statusColors = {
  "Booked": "bg-amber-100 border-amber-300 text-amber-800",
  "In Progress": "bg-blue-100 border-blue-300 text-blue-800",
  "Done": "bg-emerald-100 border-emerald-300 text-emerald-800",
  "No-show": "bg-red-100 border-red-300 text-red-800",
  "Cancelled": "bg-gray-100 border-gray-300 text-gray-600",
};

const apptTypes = ["ตรวจทั่วไป", "วัคซีน", "ผ่าตัด", "ทำแผล", "อาบน้ำตัดขน", "ฉุกเฉิน", "ติดตามผล", "อื่นๆ"];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("day");
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pet_name: "", owner_name: "", date: moment().format("YYYY-MM-DD"), time_slot: "09:00", end_time: "09:30", type: "ตรวจทั่วไป", vet_name: "", vet_id: "", notes: "" });
  const [vets, setVets] = useState([]);

  const urlParams = new URLSearchParams(window.location.search);
  useEffect(() => {
    if (urlParams.get("new") === "true") setShowAdd(true);
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await base44.entities.Appointment.filter({}, "-date", 500);
      setAppointments(data);
      const vetList = await base44.entities.Veterinarian.list("-created_date", 100);
      setVets(vetList.filter((v) => v.status === "Active"));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAppointments(); }, []);

  const weekDates = [];
  if (viewMode === "week") {
    const start = moment(selectedDate).startOf("week");
    for (let i = 0; i < 7; i++) weekDates.push(start.clone().add(i, "days").format("YYYY-MM-DD"));
  }

  const getApptsForDate = (date) => appointments.filter((a) => a.date === date);
  const getApptsForSlot = (date, slot) => appointments.filter((a) => a.date === date && a.time_slot === slot);

  const handleSave = async () => {
    if (!form.pet_name || !form.owner_name) return;
    try {
      await base44.entities.Appointment.create({ ...form, status: "Booked" });
      setShowAdd(false);
      setForm({ pet_name: "", owner_name: "", date: moment().format("YYYY-MM-DD"), time_slot: "09:00", end_time: "09:30", type: "ตรวจทั่วไป", vet_name: "", vet_id: "", notes: "" });
      loadAppointments();
    } catch {}
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const apptId = result.draggableId;
    const [newDate, newSlot] = result.destination.droppableId.split("__");
    try {
      await base44.entities.Appointment.update(apptId, { date: newDate, time_slot: newSlot });
      loadAppointments();
    } catch {}
  };

  const handleStatusChange = async (id, status) => {
    try {
      await base44.entities.Appointment.update(id, { status });
      loadAppointments();
    } catch {}
  };

  const nav = (dir) => {
    const unit = viewMode === "week" ? "weeks" : "days";
    setSelectedDate(moment(selectedDate).add(dir, unit).format("YYYY-MM-DD"));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const datesToShow = viewMode === "week" ? weekDates : [selectedDate];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">นัดหมาย</h1>
          <p className="text-muted-foreground text-sm">{appointments.length} รายการทั้งหมด</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-primary"><Plus className="w-4 h-4 mr-2" />สร้างนัดใหม่</Button>
      </div>

      {/* Date Nav */}
      <div className="flex items-center justify-between bg-white rounded-xl border p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => nav(-1)} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-sm font-medium bg-transparent border-0 focus:outline-none" />
          <button onClick={() => nav(1)} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(moment().format("YYYY-MM-DD"))}>วันนี้</Button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewMode("day")} className={`px-3 py-1.5 text-xs rounded-lg ${viewMode === "day" ? "bg-primary text-white" : "bg-muted"}`}>วัน</button>
          <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 text-xs rounded-lg ${viewMode === "week" ? "bg-primary text-white" : "bg-muted"}`}>สัปดาห์</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-xl border overflow-x-auto">
          <div className={`grid min-w-[600px]`} style={{ gridTemplateColumns: `80px repeat(${datesToShow.length}, 1fr)` }}>
            {/* Header */}
            <div className="p-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">เวลา</div>
            {datesToShow.map((d) => (
              <div key={d} className={`p-3 border-b border-l bg-muted/30 text-center ${d === moment().format("YYYY-MM-DD") ? "bg-primary/5" : ""}`}>
                <p className="text-xs text-muted-foreground">{moment(d).format("ddd")}</p>
                <p className="text-sm font-semibold">{moment(d).format("D MMM")}</p>
              </div>
            ))}

            {/* Time rows */}
            {FILTERED_SLOTS.map((slot) => (
              <React.Fragment key={slot}>
                <div className="p-2 border-b text-xs text-muted-foreground flex items-start justify-end pr-3 pt-3">{slot}</div>
                {datesToShow.map((d) => (
                  <Droppable key={`${d}__${slot}`} droppableId={`${d}__${slot}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`border-b border-l min-h-[60px] p-1 ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                      >
                        {getApptsForSlot(d, slot).map((appt, idx) => (
                          <Draggable key={appt.id} draggableId={appt.id} index={idx}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                className={`p-2 rounded-lg border text-xs mb-1 cursor-grab ${statusColors[appt.status] || statusColors.Booked}`}>
                                <p className="font-semibold truncate">{appt.pet_name}</p>
                                <p className="truncate">{appt.type}</p>
                                {appt.vet_name && <p className="text-muted-foreground truncate">{appt.vet_name}</p>}
                                <select
                                  value={appt.status}
                                  onChange={(e) => { e.stopPropagation(); handleStatusChange(appt.id, e.target.value); }}
                                  className="mt-1 text-xs bg-transparent border-0 p-0 cursor-pointer focus:outline-none w-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {Object.keys(statusColors).map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างนัดหมายใหม่</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>ชื่อสัตว์เลี้ยง *</Label><Input value={form.pet_name} onChange={(e) => setForm({...form, pet_name: e.target.value})} /></div>
            <div><Label>ชื่อเจ้าของ *</Label><Input value={form.owner_name} onChange={(e) => setForm({...form, owner_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>วันที่</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></div>
              <div>
                <Label>เวลา</Label>
                <Select value={form.time_slot} onValueChange={(v) => setForm({...form, time_slot: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FILTERED_SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>ประเภท</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{apptTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>สัตวแพทย์</Label>
              <Select value={form.vet_id} onValueChange={(v) => { const vet = vets.find((x) => x.id === v); setForm({...form, vet_id: v, vet_name: vet?.name || ""}); }}>
                <SelectTrigger><SelectValue placeholder="เลือกแพทย์" /></SelectTrigger>
                <SelectContent>
                  {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>หมายเหตุ</Label><Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
            <Button onClick={handleSave} className="w-full">บันทึกนัดหมาย</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}