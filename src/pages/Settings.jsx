import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Settings as SettingsIcon, Building, CreditCard, Users, Stethoscope, Link2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const plans = [
  { name: "Starter", price: "฿990", features: ["สัตว์เลี้ยง 200 ตัว", "ผู้ใช้ 2 คน", "รายงานพื้นฐาน"] },
  { name: "Pro", price: "฿2,490", features: ["สัตว์เลี้ยงไม่จำกัด", "ผู้ใช้ 5 คน", "LINE Integration", "รายงานขั้นสูง"] },
  { name: "Growth", price: "฿4,990", features: ["ทุกฟีเจอร์ Pro", "ผู้ใช้ไม่จำกัด", "API Access", "Priority Support"] },
];

const roles = ["ผู้ดูแล", "สัตวแพทย์", "ผู้ช่วย", "ต้อนรับ"];
const serviceCategories = ["ตรวจรักษา", "วัคซีน", "ผ่าตัด", "ทำแผล", "อาบน้ำตัดขน", "ทันตกรรม", "ห้องปฏิบัติการ", "อื่นๆ"];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "ตรวจรักษา", price: 0, duration_minutes: 30 });
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");

  useEffect(() => {
    async function load() {
      try {
        const allSettings = await base44.entities.ClinicSettings.filter({}, "-created_date", 1);
        if (allSettings.length > 0) setSettings(allSettings[0]);
        else setSettings({ clinic_name: "", license_number: "", email: "", phone: "", address: "", tax_id: "", promptpay_id: "", vat_registered: false, vat_rate: 7, line_channel_token: "", line_channel_secret: "", line_webhook_url: "", current_plan: "Starter" });
        setServices(await base44.entities.Service.filter({}, "-created_date", 200));
        setUsers(await base44.entities.User.filter({}, "-created_date", 50));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) await base44.entities.ClinicSettings.update(settings.id, settings);
      else { const created = await base44.entities.ClinicSettings.create(settings); setSettings(created); }
    } catch {}
    setSaving(false);
  };

  const handleAddService = async () => {
    if (!serviceForm.name) return;
    try {
      await base44.entities.Service.create(serviceForm);
      setShowAddService(false);
      setServiceForm({ name: "", category: "ตรวจรักษา", price: 0, duration_minutes: 30 });
      setServices(await base44.entities.Service.filter({}, "-created_date", 200));
    } catch {}
  };

  const handleDeleteService = async (id) => {
    try { await base44.entities.Service.delete(id); setServices(services.filter(s => s.id !== id)); } catch {}
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteEmail("");
      setUsers(await base44.entities.User.filter({}, "-created_date", 50));
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="clinic" className="gap-2"><Building className="w-4 h-4" />คลินิก</TabsTrigger>
          <TabsTrigger value="plans" className="gap-2"><CreditCard className="w-4 h-4" />แผน</TabsTrigger>
          <TabsTrigger value="team" className="gap-2"><Users className="w-4 h-4" />ทีม</TabsTrigger>
          <TabsTrigger value="services" className="gap-2"><Stethoscope className="w-4 h-4" />บริการ</TabsTrigger>
          <TabsTrigger value="line" className="gap-2"><Link2 className="w-4 h-4" />LINE</TabsTrigger>
        </TabsList>

        {/* Clinic Info */}
        <TabsContent value="clinic">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">ข้อมูลคลินิก</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>ชื่อคลินิก</Label><Input value={settings?.clinic_name || ""} onChange={(e) => setSettings({...settings, clinic_name: e.target.value})} /></div>
              <div><Label>เลขที่ใบอนุญาต</Label><Input value={settings?.license_number || ""} onChange={(e) => setSettings({...settings, license_number: e.target.value})} /></div>
              <div><Label>อีเมล</Label><Input value={settings?.email || ""} onChange={(e) => setSettings({...settings, email: e.target.value})} /></div>
              <div><Label>เบอร์โทร</Label><Input value={settings?.phone || ""} onChange={(e) => setSettings({...settings, phone: e.target.value})} /></div>
              <div className="md:col-span-2"><Label>ที่อยู่</Label><Input value={settings?.address || ""} onChange={(e) => setSettings({...settings, address: e.target.value})} /></div>
              <div><Label>เลขผู้เสียภาษี (13 หลัก)</Label><Input value={settings?.tax_id || ""} onChange={(e) => setSettings({...settings, tax_id: e.target.value})} maxLength={13} /></div>
              <div><Label>PromptPay ID</Label><Input value={settings?.promptpay_id || ""} onChange={(e) => setSettings({...settings, promptpay_id: e.target.value})} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={settings?.vat_registered || false} onCheckedChange={(v) => setSettings({...settings, vat_registered: v})} />
                <Label>จดทะเบียน VAT</Label>
              </div>
              {settings?.vat_registered && (
                <div><Label>อัตรา VAT (%)</Label><Input type="number" value={settings?.vat_rate || 7} onChange={(e) => setSettings({...settings, vat_rate: Number(e.target.value)})} /></div>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </div>
        </TabsContent>

        {/* Plans */}
        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-xl border p-6 ${settings?.current_plan === plan.name ? "ring-2 ring-primary border-primary" : ""}`}>
                {settings?.current_plan === plan.name && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full mb-3 inline-block">แผนปัจจุบัน</span>}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold text-primary mt-2">{plan.price}<span className="text-sm font-normal text-muted-foreground">/เดือน</span></p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">ทีมและบทบาท</h2>
            <div className="flex gap-3">
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="อีเมลผู้ใช้ใหม่" className="flex-1" />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ผู้ดูแล</SelectItem>
                  <SelectItem value="user">สัตวแพทย์</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}><Plus className="w-4 h-4 mr-2" />เชิญ</Button>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{u.full_name?.[0] || u.email?.[0]}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{u.full_name || u.email}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted">{u.role === "admin" ? "ผู้ดูแล" : "สัตวแพทย์"}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">บริการและราคา</h2>
              <Button onClick={() => setShowAddService(true)} size="sm"><Plus className="w-4 h-4 mr-2" />เพิ่มบริการ</Button>
            </div>
            {services.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">ยังไม่มีบริการ</p> : (
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.category} • {s.duration_minutes} นาที</p>
                    </div>
                    <span className="font-semibold text-sm">฿{(s.price || 0).toLocaleString()}</span>
                    <button onClick={() => handleDeleteService(s.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={showAddService} onOpenChange={setShowAddService}>
            <DialogContent>
              <DialogHeader><DialogTitle>เพิ่มบริการ</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>ชื่อบริการ *</Label><Input value={serviceForm.name} onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})} /></div>
                <div>
                  <Label>หมวดหมู่</Label>
                  <Select value={serviceForm.category} onValueChange={(v) => setServiceForm({...serviceForm, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{serviceCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>ราคา (฿)</Label><Input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({...serviceForm, price: Number(e.target.value)})} /></div>
                  <div><Label>ระยะเวลา (นาที)</Label><Input type="number" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm({...serviceForm, duration_minutes: Number(e.target.value)})} /></div>
                </div>
                <Button onClick={handleAddService} className="w-full">บันทึก</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* LINE */}
        <TabsContent value="line">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">LINE Channel</h2>
            <p className="text-sm text-muted-foreground">เชื่อมต่อ LINE Official Account เพื่อส่ง notification และ reminder</p>
            <div><Label>Webhook URL</Label><Input value={settings?.line_webhook_url || ""} onChange={(e) => setSettings({...settings, line_webhook_url: e.target.value})} placeholder="https://..." /></div>
            <div><Label>Channel Access Token</Label><Input value={settings?.line_channel_token || ""} onChange={(e) => setSettings({...settings, line_channel_token: e.target.value})} /></div>
            <div><Label>Channel Secret</Label><Input value={settings?.line_channel_secret || ""} onChange={(e) => setSettings({...settings, line_channel_secret: e.target.value})} type="password" /></div>
            <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}