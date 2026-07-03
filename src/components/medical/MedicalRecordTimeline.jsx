import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Weight, Thermometer, Paperclip, ChevronDown, ChevronUp, X } from "lucide-react";
import moment from "moment";
import EmptyState from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";

const typeColors = {
  "ตรวจทั่วไป": "bg-blue-100 text-blue-700",
  "ผลตรวจแล็บ": "bg-purple-100 text-purple-700",
  "ภาพเอกซเรย์": "bg-teal-100 text-teal-700",
  "ติดตามอาการ": "bg-amber-100 text-amber-700",
  "ผ่าตัด": "bg-red-100 text-red-700",
  "ฉุกเฉิน": "bg-orange-100 text-orange-700",
  "อื่นๆ": "bg-gray-100 text-gray-700",
};

export default function MedicalRecordTimeline({ records }) {
  const [expandedId, setExpandedId] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  if (records.length === 0) {
    return <EmptyState icon={FileText} title="ยังไม่มีเวชระเบียน" description="เพิ่มเวชระเบียนเพื่อบันทึกประวัติการรักษา" />;
  }

  const sorted = [...records].sort((a, b) => moment(b.record_date).diff(moment(a.record_date)));

  return (
    <>
      <div className="relative space-y-4">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        {sorted.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const tc = typeColors[rec.record_type] || typeColors["อื่นๆ"];
          return (
            <div key={rec.id} className="relative pl-12">
              <div className={`absolute left-2 top-3 w-5 h-5 rounded-full ${tc} border-2 border-white flex items-center justify-center`}>
                <div className="w-2 h-2 rounded-full bg-current opacity-50" />
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={tc} variant="outline">{rec.record_type}</Badge>
                      {rec.title && <span className="font-medium text-sm">{rec.title}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {moment(rec.record_date).format("D MMM YYYY, HH:mm น.")}
                      {rec.vet_name && <span className="ml-2 inline-flex items-center gap-1"><Stethoscope className="w-3 h-3" />{rec.vet_name}</span>}
                    </p>
                  </div>
                  {(rec.diagnosis || rec.treatment || rec.notes || (rec.attachments?.length > 0)) && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>

                <div className="flex gap-4 mt-2">
                  {rec.weight && <span className="text-xs text-muted-foreground flex items-center gap-1"><Weight className="w-3 h-3" />{rec.weight} กก.</span>}
                  {rec.temperature && <span className="text-xs text-muted-foreground flex items-center gap-1"><Thermometer className="w-3 h-3" />{rec.temperature}°C</span>}
                  {rec.attachments?.length > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip className="w-3 h-3" />{rec.attachments.length} รูป</span>}
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-2 pt-3 border-t">
                    {rec.diagnosis && <div className="text-sm"><span className="text-muted-foreground text-xs">วินิจฉัย: </span>{rec.diagnosis}</div>}
                    {rec.treatment && <div className="text-sm"><span className="text-muted-foreground text-xs">การรักษา: </span>{rec.treatment}</div>}
                    {rec.notes && <div className="text-sm"><span className="text-muted-foreground text-xs">หมายเหตุ: </span>{rec.notes}</div>}
                    {rec.attachments?.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                        {rec.attachments.map((url, idx) => (
                          <button key={idx} onClick={() => setLightboxImg(url)} className="group relative">
                            <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-8 h-8" /></button>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </>
  );
}