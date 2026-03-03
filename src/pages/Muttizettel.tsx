import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const Muttizettel = () => {
  const [formData, setFormData] = useState({
    childName: "",
    childBirthdate: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    eventName: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageLayout title="Muttizettel" subtitle="Für Gäste unter 18 Jahren">
      <div className="space-y-6">
        <p>
          Noch keine 18? Kein Problem! Mit einem gültigen Muttizettel kannst du ab 16 Jahren an unseren Events teilnehmen. Fülle das Formular aus und bringe den ausgedruckten & unterschriebenen Muttizettel zum Event mit.
        </p>

        {submitted ? (
          <div
            className="p-8 rounded-2xl text-center"
            style={{ background: "hsl(142 70% 45% / 0.1)", border: "1px solid hsl(142 70% 45% / 0.2)" }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: "hsl(142 70% 55%)" }}>✓ Muttizettel eingereicht!</p>
            <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              Du erhältst eine Bestätigung per E-Mail. Bitte drucke den Muttizettel aus und bringe ihn unterschrieben mit.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Event</label>
              <select
                required
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                className="pp-form-input"
              >
                <option value="">Event wählen...</option>
                <option value="project-paderborn">PROJECT PADERBORN – 05.04.2025</option>
                <option value="city-madness">CITY MADNESS – 19.04.2025</option>
                <option value="neon-nights">NEON NIGHTS – 03.05.2025</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Vollständiger Name des Kindes</label>
              <input
                type="text" required maxLength={100}
                value={formData.childName} onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                className="pp-form-input" placeholder="Max Mustermann"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Geburtsdatum</label>
              <input
                type="date" required
                value={formData.childBirthdate} onChange={(e) => setFormData({ ...formData, childBirthdate: e.target.value })}
                className="pp-form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Name Erziehungsberechtigte/r</label>
              <input
                type="text" required maxLength={100}
                value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="pp-form-input" placeholder="Maria Mustermann"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Telefon Erziehungsberechtigte/r</label>
              <input
                type="tel" required maxLength={20}
                value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="pp-form-input" placeholder="+49 123 456789"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>E-Mail Erziehungsberechtigte/r</label>
              <input
                type="email" required maxLength={255}
                value={formData.parentEmail} onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                className="pp-form-input" placeholder="maria@beispiel.de"
              />
            </div>
            <motion.button
              type="submit"
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider"
              style={{ background: "hsl(0 70% 50%)", color: "white", boxShadow: "0 4px 20px hsl(0 70% 50% / 0.4)" }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Muttizettel einreichen
            </motion.button>
          </form>
        )}
      </div>
    </PageLayout>
  );
};

export default Muttizettel;
