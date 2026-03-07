import { PageLayout } from "@/components/PageLayout";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Check, FileText, Users, User, Shield, ClipboardCheck, PartyPopper } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Event", icon: PartyPopper },
  { label: "Elternteil", icon: Users },
  { label: "Kind", icon: User },
  { label: "Begleitperson", icon: Shield },
  { label: "Zusammenfassung", icon: ClipboardCheck },
  { label: "Fertig", icon: Check },
];

interface MuttizettelForm {
  eventId: string;
  eventName: string;
  parentName: string;
  parentAddress: string;
  parentZip: string;
  parentCity: string;
  parentCountry: string;
  parentPhone: string;
  parentBirthdate: string;
  parentEmail: string;
  childName: string;
  childBirthdate: string;
  childAddress: string;
  childZip: string;
  childCity: string;
  childPhone: string;
  companionName: string;
  companionPhone: string;
  companionBirthdate: string;
}

const emptyForm: MuttizettelForm = {
  eventId: "", eventName: "",
  parentName: "", parentAddress: "", parentZip: "", parentCity: "", parentCountry: "Deutschland",
  parentPhone: "", parentBirthdate: "", parentEmail: "",
  childName: "", childBirthdate: "", childAddress: "", childZip: "", childCity: "", childPhone: "",
  companionName: "", companionPhone: "", companionBirthdate: "",
};

const Muttizettel = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MuttizettelForm>(emptyForm);
  const [events, setEvents] = useState<{ id: string; title: string; date: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    supabase
      .from("events")
      .select("id, title, date")
      .eq("status", "published")
      .eq("muttizettel", true)
      .order("date", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setEvents(data);
          // Auto-select event from URL param
          const eventParam = searchParams.get("event");
          if (eventParam) {
            const match = data.find((e) => e.id === eventParam);
            if (match) {
              setForm((prev) => ({
                ...prev,
                eventId: match.id,
                eventName: match.title + (match.date ? ` – ${new Date(match.date).toLocaleDateString("de-DE")}` : ""),
              }));
            }
          }
        }
      });
  }, []);

  const set = (key: keyof MuttizettelForm, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const canNext = (): boolean => {
    if (step === 0) return !!form.eventId;
    if (step === 1) return !!form.parentName && !!form.parentPhone && !!form.parentBirthdate;
    if (step === 2) return !!form.childName && !!form.childBirthdate;
    if (step === 3) return !!form.companionName && !!form.companionPhone;
    return true;
  };

  const next = () => { if (canNext()) { setDirection(1); setStep((s) => Math.min(s + 1, 5)); } };
  const prev = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("muttizettel_submissions").insert({
      event_id: form.eventId || null,
      event_name: form.eventName,
      parent_name: form.parentName,
      parent_address: form.parentAddress,
      parent_zip: form.parentZip,
      parent_city: form.parentCity,
      parent_country: form.parentCountry,
      parent_phone: form.parentPhone,
      parent_birthdate: form.parentBirthdate || null,
      parent_email: form.parentEmail || null,
      child_name: form.childName,
      child_birthdate: form.childBirthdate,
      child_address: form.childAddress || null,
      child_zip: form.childZip || null,
      child_city: form.childCity || null,
      child_phone: form.childPhone || null,
      companion_name: form.companionName || null,
      companion_phone: form.companionPhone || null,
      companion_birthdate: form.companionBirthdate || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Fehler beim Einreichen. Bitte versuche es erneut.");
      console.error(error);
    } else {
      setDirection(1);
      setStep(5);
    }
  };

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-[hsl(220_15%_93%)] border border-[hsl(220_15%_85%)] text-[hsl(220_20%_15%)] focus:border-[hsl(230_80%_56%)] focus:ring-2 focus:ring-[hsl(230_80%_56%/0.15)]";
  const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5 text-muted-foreground";

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Wähle das Event, für das du den Muttizettel einreichen möchtest.</p>
            <div className="space-y-2">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => { set("eventId", ev.id); set("eventName", ev.title + (ev.date ? ` – ${new Date(ev.date).toLocaleDateString("de-DE")}` : "")); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm font-medium ${
                    form.eventId === ev.id
                      ? "border-[hsl(230_80%_56%)] bg-[hsl(230_80%_56%/0.08)] text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-[hsl(230_80%_56%/0.4)]"
                  }`}
                >
                  <span className="font-semibold">{ev.title}</span>
                  {ev.date && <span className="ml-2 opacity-60">{new Date(ev.date).toLocaleDateString("de-DE")}</span>}
                </button>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">Keine Events mit Muttizettel verfügbar.</p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Daten der sorgeberechtigten Person (z.B. Vater oder Mutter).</p>
            <div>
              <label className={labelCls}>👤 Name Elternteil *</label>
              <input className={inputCls} required value={form.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="Vor- & Nachname" />
            </div>
            <div>
              <label className={labelCls}>🏡 Anschrift</label>
              <input className={inputCls} value={form.parentAddress} onChange={(e) => set("parentAddress", e.target.value)} placeholder="Straße, Hausnummer" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input className={inputCls} value={form.parentZip} onChange={(e) => set("parentZip", e.target.value)} placeholder="PLZ" />
                <input className={inputCls} value={form.parentCity} onChange={(e) => set("parentCity", e.target.value)} placeholder="Stadt" />
              </div>
            </div>
            <div>
              <label className={labelCls}>🌍 Land</label>
              <select className={inputCls} value={form.parentCountry} onChange={(e) => set("parentCountry", e.target.value)}>
                <option>Deutschland</option>
                <option>Österreich</option>
                <option>Schweiz</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>📞 Telefon *</label>
              <input className={inputCls} type="tel" required value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} placeholder="+49 123 456789" />
            </div>
            <div>
              <label className={labelCls}>🎂 Geburtsdatum *</label>
              <input className={inputCls} type="date" required value={form.parentBirthdate} onChange={(e) => set("parentBirthdate", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>✉️ E-Mail</label>
              <input className={inputCls} type="email" value={form.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} placeholder="elternteil@beispiel.de" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Daten des minderjährigen Gastes.</p>
            <div>
              <label className={labelCls}>👤 Name des Kindes *</label>
              <input className={inputCls} required value={form.childName} onChange={(e) => set("childName", e.target.value)} placeholder="Vor- & Nachname" />
            </div>
            <div>
              <label className={labelCls}>🎂 Geburtsdatum *</label>
              <input className={inputCls} type="date" required value={form.childBirthdate} onChange={(e) => set("childBirthdate", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>🏡 Anschrift</label>
              <input className={inputCls} value={form.childAddress} onChange={(e) => set("childAddress", e.target.value)} placeholder="Straße, Hausnummer" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input className={inputCls} value={form.childZip} onChange={(e) => set("childZip", e.target.value)} placeholder="PLZ" />
                <input className={inputCls} value={form.childCity} onChange={(e) => set("childCity", e.target.value)} placeholder="Stadt" />
              </div>
            </div>
            <div>
              <label className={labelCls}>📞 Telefon</label>
              <input className={inputCls} type="tel" value={form.childPhone} onChange={(e) => set("childPhone", e.target.value)} placeholder="+49 123 456789" />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Die volljährige Person, die während der Veranstaltung die Aufsicht übernimmt.</p>
            <div>
              <label className={labelCls}>👤 Name Begleitperson *</label>
              <input className={inputCls} required value={form.companionName} onChange={(e) => set("companionName", e.target.value)} placeholder="Vor- & Nachname" />
            </div>
            <div>
              <label className={labelCls}>📞 Telefon *</label>
              <input className={inputCls} type="tel" required value={form.companionPhone} onChange={(e) => set("companionPhone", e.target.value)} placeholder="+49 123 456789" />
            </div>
            <div>
              <label className={labelCls}>🎂 Geburtsdatum</label>
              <input className={inputCls} type="date" value={form.companionBirthdate} onChange={(e) => set("companionBirthdate", e.target.value)} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Bitte prüfe deine Angaben.</p>
            {[
              { title: "Event", value: form.eventName },
              { title: "Elternteil", value: `${form.parentName}${form.parentPhone ? ` · ${form.parentPhone}` : ""}` },
              { title: "Kind", value: `${form.childName} · ${form.childBirthdate ? new Date(form.childBirthdate).toLocaleDateString("de-DE") : ""}` },
              { title: "Begleitperson", value: `${form.companionName}${form.companionPhone ? ` · ${form.companionPhone}` : ""}` },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">{item.title}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mit dem Einreichen bestätigst du, dass alle Angaben korrekt sind und die sorgeberechtigte Person der Erziehungsbeauftragung zustimmt.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[hsl(142_70%_45%)] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Muttizettel eingereicht! 🎉</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Dein Muttizettel wurde erfolgreich hinterlegt. Bitte bringe einen gültigen Ausweis zum Event mit.
            </p>
            <button
              onClick={() => { setForm(emptyForm); setStep(0); }}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Neuen Muttizettel erstellen
            </button>
          </div>
        );
    }
  };

  return (
    <PageLayout title="Muttizettel" subtitle="Dein Clubzettel für eine unvergessliche Nacht. 🎉">
      <div className="max-w-lg mx-auto">
        {/* Progress bar */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEPS.slice(0, 5).map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        done
                          ? "bg-[hsl(230_80%_56%)] text-white"
                          : active
                          ? "bg-[hsl(230_80%_56%/0.15)] text-[hsl(230_80%_56%)] border-2 border-[hsl(230_80%_56%)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-[hsl(230_80%_56%)] rounded-full"
                initial={false}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Schritt {step + 1} von 5 – {STEPS[step].label}</p>
          </div>
        )}

        {/* Step content */}
        <div className="relative overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <motion.button
                type="button"
                onClick={prev}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider border border-border bg-card text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={step === 4 ? submit : next}
              disabled={!canNext() || submitting}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all ${
                canNext() && !submitting
                  ? "bg-[hsl(230_80%_56%)] hover:bg-[hsl(230_80%_50%)] shadow-lg shadow-[hsl(230_80%_56%/0.3)]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
              whileTap={canNext() ? { scale: 0.97 } : {}}
            >
              {submitting ? "Wird eingereicht..." : step === 4 ? "Einreichen" : "Weiter"}{" "}
              {!submitting && step < 4 && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          </div>
        )}

        {/* SSL note */}
        {step < 5 && (
          <p className="text-center text-[10px] text-muted-foreground mt-4 flex items-center justify-center gap-1">
            🔒 Sichere Datenübertragung durch SSL-Verschlüsselung
          </p>
        )}
      </div>
    </PageLayout>
  );
};

export default Muttizettel;
