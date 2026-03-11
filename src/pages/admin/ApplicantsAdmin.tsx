import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Eye, Mail, Phone, MapPin, Instagram, Briefcase, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type Applicant = {
  id: string;
  subject: string;
  customer_email: string;
  customer_name: string | null;
  status: string;
  created_at: string;
  metadata: {
    alter?: string;
    instagram?: string;
    stadt?: string;
    telefon?: string;
    bereich?: string;
    kommentar?: string;
  } | null;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Offen", color: "hsl(45 90% 55%)", bg: "hsl(45 90% 55% / 0.12)" },
  in_progress: { label: "In Bearbeitung", color: "hsl(220 70% 55%)", bg: "hsl(220 70% 55% / 0.12)" },
  resolved: { label: "Angenommen", color: "hsl(140 60% 45%)", bg: "hsl(140 60% 45% / 0.12)" },
  closed: { label: "Abgelehnt", color: "hsl(0 70% 55%)", bg: "hsl(0 70% 55% / 0.12)" },
};

const ApplicantsAdmin = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("category", "job")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Applicant[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "resolved" || status === "closed") {
        updateData.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("support_tickets").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
      toast.success(status === "resolved" ? "Bewerber angenommen!" : status === "closed" ? "Bewerber abgelehnt." : "Status aktualisiert.");
    },
    onError: () => toast.error("Fehler beim Aktualisieren."),
  });

  const filtered = filterStatus === "all" ? applicants : applicants.filter((a) => a.status === filterStatus);

  const counts = {
    all: applicants.length,
    open: applicants.filter((a) => a.status === "open").length,
    resolved: applicants.filter((a) => a.status === "resolved").length,
    closed: applicants.filter((a) => a.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bewerber</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          Job-Bewerbungen verwalten – annehmen oder ablehnen
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "resolved", "closed"] as const).map((key) => {
          const labels: Record<string, string> = { all: "Alle", open: "Offen", resolved: "Angenommen", closed: "Abgelehnt" };
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filterStatus === key ? "hsl(270 70% 55% / 0.2)" : "hsl(0 0% 100% / 0.05)",
                color: filterStatus === key ? "hsl(270 70% 55%)" : "hsl(0 0% 100% / 0.5)",
                border: `1px solid ${filterStatus === key ? "hsl(270 70% 55% / 0.3)" : "transparent"}`,
              }}
            >
              {labels[key]} ({counts[key]})
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Bewerbungen gefunden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const meta = app.metadata || {};
            const expanded = expandedId === app.id;
            const st = statusConfig[app.status] || statusConfig.open;

            return (
              <div
                key={app.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  background: "hsl(220 40% 10%)",
                  border: "1px solid hsl(0 0% 100% / 0.06)",
                }}
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : app.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white truncate">
                        {app.customer_name || "Unbekannt"}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                      {meta.bereich && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(270 70% 55% / 0.12)", color: "hsl(270 70% 55%)" }}
                        >
                          {meta.bereich}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {app.customer_email}
                      </span>
                      {meta.stadt && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {meta.stadt}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(app.created_at), "dd. MMM yyyy, HH:mm", { locale: de })}
                      </span>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                  )}
                </button>

                {/* Expanded Details */}
                {expanded && (
                  <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                      {meta.alter && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Alter</span>
                          <p className="text-sm text-white">{meta.alter}</p>
                        </div>
                      )}
                      {meta.telefon && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Telefon</span>
                          <p className="text-sm text-white flex items-center gap-1">
                            <Phone className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
                            {meta.telefon}
                          </p>
                        </div>
                      )}
                      {meta.instagram && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Instagram</span>
                          <p className="text-sm text-white flex items-center gap-1">
                            <Instagram className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
                            {meta.instagram}
                          </p>
                        </div>
                      )}
                      {meta.stadt && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Stadt</span>
                          <p className="text-sm text-white">{meta.stadt}</p>
                        </div>
                      )}
                      {meta.bereich && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Bereich</span>
                          <p className="text-sm text-white">{meta.bereich}</p>
                        </div>
                      )}
                    </div>

                    {meta.kommentar && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Kommentar</span>
                        <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                          {meta.kommentar}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {app.status !== "resolved" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: app.id, status: "resolved" })}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                          style={{ background: "hsl(140 60% 45%)", color: "white" }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Annehmen
                        </button>
                      )}
                      {app.status !== "closed" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: app.id, status: "closed" })}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                          style={{ background: "hsl(0 70% 50%)", color: "white" }}
                        >
                          <X className="w-3.5 h-3.5" />
                          Ablehnen
                        </button>
                      )}
                      {app.status !== "open" && (
                        <button
                          onClick={() => updateStatus.mutate({ id: app.id, status: "open" })}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}
                        >
                          Zurücksetzen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicantsAdmin;
