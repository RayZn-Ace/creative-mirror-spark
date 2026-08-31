import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Handshake, LogOut, Loader2, CalendarDays, Ticket, Euro, ScanLine,
  Gauge, Sofa, Images, ListPlus, ArrowLeft,
} from "lucide-react";
import { PARTNER_PERMISSIONS } from "@/lib/partnerPermissions";

const PURPLE = "hsl(270 70% 55%)";

const ICONS: Record<string, any> = {
  events: CalendarDays,
  tickets: Ticket,
  revenue: Euro,
  checkins: ScanLine,
  capacity: Gauge,
  lounges: Sofa,
  media: Images,
  waitlist: ListPlus,
};

const card: React.CSSProperties = {
  background: "hsl(0 0% 100% / 0.03)",
  border: "1px solid hsl(0 0% 100% / 0.07)",
};

const inputStyle: React.CSSProperties = {
  background: "hsl(0 0% 100% / 0.06)",
  border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)",
  borderRadius: "10px",
  padding: "12px 14px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const eur = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n || 0);

const dateStr = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const PartnerArea = () => {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const { data: res, error: err } = await supabase.functions.invoke("partner-data", { body: {} });
    if (err || (res as any)?.error) {
      setError((res as any)?.error ?? err?.message ?? "Fehler beim Laden");
      setData(null);
      return;
    }
    setData(res);
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (err) toast.error("Login fehlgeschlagen: " + err.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setData(null);
    setTab(null);
  };

  const events = data?.events ?? [];
  const eventTitle = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach((e: any) => (map[e.id] = e.title));
    return map;
  }, [events]);

  const perms: string[] = data?.partner?.permissions ?? [];
  const tiles = PARTNER_PERMISSIONS.filter((p) => perms.includes(p.key));

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: PURPLE }} />
      </div>
    );
  }

  if (!session || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={card}>
          <div className="text-center space-y-1">
            <Handshake className="w-8 h-8 mx-auto" style={{ color: PURPLE }} />
            <h1 className="text-xl font-black text-foreground">Partnerbereich</h1>
            <p className="text-xs text-muted-foreground">
              {error ?? "Bitte mit deinen Partner-Zugangsdaten anmelden"}
            </p>
          </div>
          <input style={inputStyle} type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-50"
            style={{ background: PURPLE, color: "#fff" }}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Anmelden
          </button>
          {session && (
            <button type="button" onClick={logout} className="w-full text-xs text-muted-foreground underline">
              Mit anderem Konto anmelden
            </button>
          )}
        </form>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: PURPLE }} />
      </div>
    );
  }

  const renderDetail = () => {
    switch (tab) {
      case "events":
        return (
          <div className="space-y-2">
            {events.map((e: any) => (
              <div key={e.id} className="rounded-xl p-4 flex flex-wrap justify-between gap-2" style={card}>
                <div>
                  <p className="font-bold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr(e.date)} {e.time ? `· ${e.time}` : ""} {e.city ? `· ${e.city}` : ""}
                    {e.location_name ? ` · ${e.location_name}` : ""}
                  </p>
                </div>
                {e.sold_out && (
                  <span className="self-center rounded px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: "hsl(0 60% 55% / 0.15)", color: "hsl(0 70% 65%)" }}>
                    Ausverkauft
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      case "tickets": {
        const t = data.tickets;
        if (!t) return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Tickets gesamt" value={String(t.total)} />
              <Stat label="Bestellungen" value={String(t.orders)} />
            </div>
            {Object.entries(t.byEvent ?? {}).map(([id, v]: any) => (
              <div key={id} className="rounded-xl p-4 flex justify-between" style={card}>
                <span className="text-sm text-foreground">{eventTitle[id] ?? "Unbekannt"}</span>
                <span className="text-sm font-bold" style={{ color: PURPLE }}>{v.tickets} Tickets</span>
              </div>
            ))}
          </div>
        );
      }
      case "revenue": {
        const r = data.revenue;
        if (!r) return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Heute" value={eur(r.today)} />
              <Stat label="7 Tage" value={eur(r.week)} />
              <Stat label="Monat" value={eur(r.month)} />
              <Stat label="Gesamt" value={eur(r.total)} />
            </div>
            {Object.entries(r.byEvent ?? {}).map(([id, v]: any) => (
              <div key={id} className="rounded-xl p-4 flex justify-between" style={card}>
                <span className="text-sm text-foreground">{eventTitle[id] ?? "Unbekannt"}</span>
                <span className="text-sm font-bold" style={{ color: PURPLE }}>{eur(v)}</span>
              </div>
            ))}
          </div>
        );
      }
      case "checkins": {
        const c = data.checkins;
        if (!c) return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Tickets" value={String(c.total)} />
              <Stat label="Eingecheckt" value={String(c.checked)} />
            </div>
            {Object.entries(c.byEvent ?? {}).map(([id, v]: any) => (
              <div key={id} className="rounded-xl p-4" style={card}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{eventTitle[id] ?? "Unbekannt"}</span>
                  <span style={{ color: PURPLE }}>{v.checked}/{v.total}</span>
                </div>
                <Bar value={v.total ? (v.checked / v.total) * 100 : 0} />
              </div>
            ))}
          </div>
        );
      }
      case "capacity": {
        const rows = data.capacity ?? [];
        return (
          <div className="space-y-2">
            {rows.map((c: any) => {
              const pct = c.max_capacity ? Math.min(100, (c.sold / c.max_capacity) * 100) : 0;
              return (
                <div key={c.id} className="rounded-xl p-4" style={card}>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {eventTitle[c.event_id] ?? ""} · {c.name}
                    </span>
                    <span style={{ color: PURPLE }}>
                      {c.sold}
                      {c.max_capacity ? ` / ${c.max_capacity}` : ""}
                    </span>
                  </div>
                  {!!c.max_capacity && <Bar value={pct} />}
                </div>
              );
            })}
          </div>
        );
      }
      case "lounges": {
        const l = data.lounges;
        if (!l?.bookings?.length) return <p className="text-sm text-muted-foreground">Keine Buchungen.</p>;
        return (
          <div className="space-y-2">
            {l.bookings.map((b: any) => (
              <div key={b.id} className="rounded-xl p-4 flex flex-wrap justify-between gap-2" style={card}>
                <div>
                  <p className="text-sm font-bold text-foreground">{l.names?.[b.lounge_id] ?? "Lounge"}</p>
                  <p className="text-xs text-muted-foreground">
                    {eventTitle[b.event_id] ?? ""} · {b.party_size ?? "?"} Personen
                  </p>
                </div>
                <span className="self-center text-xs" style={{ color: PURPLE }}>{b.status}</span>
              </div>
            ))}
          </div>
        );
      }
      case "media": {
        const albums = data.albums ?? [];
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a: any) => (
              <div key={a.id} className="rounded-xl overflow-hidden" style={card}>
                {a.cover_image_url && (
                  <img src={a.cover_image_url} alt={a.title} loading="lazy" className="w-full h-32 object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr(a.event_date)} · {a.photo_count} Medien
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      }
      case "waitlist": {
        const w = data.waitlist;
        if (!w) return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
        return (
          <div className="space-y-2">
            <Stat label="Einträge gesamt" value={String(w.total)} />
            {Object.entries(w.byEvent ?? {}).map(([id, v]: any) => (
              <div key={id} className="rounded-xl p-4 flex justify-between" style={card}>
                <span className="text-sm text-foreground">{eventTitle[id] ?? "Unbekannt"}</span>
                <span className="text-sm font-bold" style={{ color: PURPLE }}>{v}</span>
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ borderColor: "hsl(0 0% 100% / 0.07)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-black text-foreground">
              <Handshake className="w-5 h-5" style={{ color: PURPLE }} /> Partnerbereich
            </h1>
            <p className="text-xs text-muted-foreground">
              {data.partner?.name}
              {data.partner?.company ? ` · ${data.partner.company}` : ""}
              {data.partner?.series?.length
                ? ` · ${data.partner.series.map((s: any) => s.title).join(", ")}`
                : ""}
            </p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {tiles.length === 0 ? (
          <div className="rounded-2xl p-10 text-center text-sm text-muted-foreground" style={card}>
            Für deinen Zugang wurden noch keine Bereiche freigeschaltet.
          </div>
        ) : tab ? (
          <div className="space-y-4">
            <button onClick={() => setTab(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Übersicht
            </button>
            <h2 className="text-xl font-black text-foreground">
              {PARTNER_PERMISSIONS.find((p) => p.key === tab)?.label}
            </h2>
            {renderDetail()}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t) => {
              const Icon = ICONS[t.key] ?? CalendarDays;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
                  style={card}
                >
                  <Icon className="w-6 h-6 mb-3" style={{ color: PURPLE }} />
                  <p className="font-black text-foreground">{t.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl p-4" style={card}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-black" style={{ color: PURPLE }}>{value}</p>
  </div>
);

const Bar = ({ value }: { value: number }) => (
  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
    <div className="h-full rounded-full" style={{ width: `${value}%`, background: PURPLE }} />
  </div>
);

export default PartnerArea;
