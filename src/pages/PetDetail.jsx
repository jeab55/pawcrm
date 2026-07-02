import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Phone, Mail, PawPrint, CalendarDays, Syringe } from "lucide-react";
import moment from "moment";

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await base44.entities.Pet.get(id);
        setPet(p);
        const [appts, vacs] = await Promise.all([
          base44.entities.Appointment.filter({ pet_id: id }, "-date", 20),
          base44.entities.Vaccination.filter({ pet_id: id }, "-administered_date", 20),
        ]);
        setAppointments(appts);
        setVaccinations(vacs);
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!pet) return <div className="text-center py-20 text-muted-foreground">ไม่พบสัตว์เลี้ยง</div>;

  const age = pet.date_of_birth ? moment().diff(moment(pet.date_of_birth), "years") + " ปี" : "-";

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/pets")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0">
            {pet.name?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{pet.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${pet.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{pet.status}</span>
            </div>
            <p className="text-muted-foreground">{pet.species} {pet.breed ? `• ${pet.breed}` : ""} {pet.gender ? `• ${pet.gender}` : ""}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div><p className="text-xs text-muted-foreground">อายุ</p><p className="text-sm font-medium">{age}</p></div>
              <div><p className="text-xs text-muted-foreground">น้ำหนัก</p><p className="text-sm font-medium">{pet.weight ? `${pet.weight} กก.` : "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">สี</p><p className="text-sm font-medium">{pet.color || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">ไมโครชิป</p><p className="text-sm font-medium">{pet.microchip_id || "-"}</p></div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/40 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">ข้อมูลเจ้าของ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2"><PawPrint className="w-4 h-4 text-muted-foreground" />{pet.owner_name}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{pet.owner_phone}</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{pet.owner_email || "-"}</div>
          </div>
        </div>

        {pet.allergies && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            <strong>ภูมิแพ้/ข้อควรระวัง:</strong> {pet.allergies}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> ประวัตินัดหมาย</h2>
          {appointments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีนัดหมาย</p> : (
            <div className="space-y-2">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-sm">
                  <div><p className="font-medium">{a.date}</p><p className="text-xs text-muted-foreground">{a.time_slot}</p></div>
                  <div className="flex-1"><p>{a.type}</p></div>
                  <span className={`text-xs px-2 py-1 rounded-full ${a.status === "Done" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Syringe className="w-4 h-4" /> ประวัติวัคซีน</h2>
          {vaccinations.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีข้อมูลวัคซีน</p> : (
            <div className="space-y-2">
              {vaccinations.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-sm">
                  <div><p className="font-medium">{v.vaccine_name}</p><p className="text-xs text-muted-foreground">{v.administered_date}</p></div>
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Lot: {v.lot_number || "-"}</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">ครั้งถัดไป</p><p className="text-xs font-medium">{v.next_due_date || "-"}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}