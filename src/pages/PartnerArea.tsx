import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Handshake, LogOut, Loader2, CalendarDays, Ticket, Euro, ScanLine,
  Gauge, Sofa, Images, ListPlus, ArrowLeft, Users, ChevronRight, Sparkles,
} from "lucide-react";

import { PARTNER_PERMISSIONS } from "@/lib/partnerPermissions";
import nightlifeLogo from "@/assets/nightlife-generation-logo.png";

const PURPLE = "hsl(270 70% 55%)";

const PartnerIntro = () => (
  <div className="pp-intro">
    <div className="pp-intro-sweep" />
    <div className="pp-intro-ring" />
    <div className="pp-intro-ring" style={{ animationDelay: "0.8s" }} />
    <div className="pp-intro-ring" style={{ animationDelay: "1.6s" }} />
    <img src={nightlifeLogo} alt="Nightlife Generation" className="pp-intro-logo relative z-10" />
    <p className="pp-intro-word text-xs font-black uppercase pp-gradient-text">Partnerbereich</p>
  </div>
);


const ICONS: Record<string, any> = {
  events: CalendarDays,
  tickets: Ticket,
  customers: Users,
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
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [intro, setIntro] = useState(() => !sessionStorage.getItem("pp-intro-seen"));

  useEffect(() => {
    if (!intro) return;
    sessionStorage.setItem("pp-intro-seen", "1");
    const t = setTimeout(() => setIntro(false), 3400);
    return () => clearTimeout(t);
  }, [intro]);



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
    setOpenEvent(null);
  };

  const events = data?.events ?? [];
  const eventTitle = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach((e: any) => (map[e.id] = e.title));
    return map;
  }, [events]);

  const perms: string[] = data?.partner?.permissions ?? [];
  const tiles = PARTNER_PERMISSIONS.filter((p) => perms.includes(p.key));

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Gute Nacht" : hour < 11 ? "Guten Morgen" : hour < 18 ? "Hey" : "Guten Abend";
  const firstName = (data?.partner?.name ?? "Partner").split(" ")[0];

  const heroChips = useMemo(() => {
    const chips: { label: string; value: string }[] = [];
    const upcoming = events.filter((e: any) => !e.date || new Date(e.date).getTime() >= Date.now() - 864e5);
    chips.push({ label: "Events", value: String(upcoming.length || events.length) });
    if (data?.tickets) chips.push({ label: "Tickets verkauft", value: String(data.tickets.total ?? 0) });
    if (data?.revenue) chips.push({ label: "Umsatz gesamt", value: eur(data.revenue.total ?? 0) });
    if (data?.checkins) chips.push({ label: "Eingecheckt", value: `${data.checkins.checked ?? 0}/${data.checkins.total ?? 0}` });
    if (data?.partner?.series?.length) chips.push({ label: "Reihen", value: String(data.partner.series.length) });
    return chips;
  }, [events, data]);


  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {intro && <PartnerIntro />}
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: PURPLE }} />
      </div>
    );
  }

  if (!session || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        {intro && <PartnerIntro />}
        <div className="pp-aurora" />
        <div className="pp-grid" />
        <form onSubmit={login} className="pp-rise relative z-10 w-full max-w-sm rounded-2xl p-6 space-y-4 backdrop-blur-xl" style={{ ...card, animationDelay: "0.1s" }}>
          <div className="text-center space-y-2">
            <img src={nightlifeLogo} alt="Nightlife Generation" className="mx-auto h-14 object-contain" style={{ filter: "drop-shadow(0 0 18px hsl(270 80% 60% / 0.6))" }} />
            <h1 className="text-xl font-black pp-gradient-text">Partnerbereich</h1>
            <p className="text-xs text-muted-foreground">
              {error ?? "Bitte mit deinen Partner-Zugangsdaten anmelden"}
            </p>
          </div>
          <input style={inputStyle} type="email" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-50 transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(100deg, hsl(270 80% 55%), hsl(330 85% 60%))", color: "#fff", boxShadow: "0 10px 30px -12px hsl(270 80% 55% / 0.9)" }}
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
      case "events": {
        const ev = events.find((e: any) => e.id === openEvent);
        if (ev) {
          const cats = (data.categories ?? []).filter((c: any) => c.event_id === ev.id);
          const now = Date.now();
          const catState = (c: any) => {
            if (c.sold_out) return { label: "Ausverkauft", color: "hsl(0 70% 65%)" };
            if (c.coming_soon) return { label: "Kommt bald", color: "hsl(45 90% 60%)" };
            if (c.sale_start && new Date(c.sale_start).getTime() > now) return { label: "Startet später", color: "hsl(45 90% 60%)" };
            if (c.sale_end && new Date(c.sale_end).getTime() < now) return { label: "Beendet", color: "hsl(0 0% 60%)" };
            return { label: "Im Verkauf", color: "hsl(140 60% 55%)" };
          };
          return (
            <div className="space-y-4">
              <button onClick={() => setOpenEvent(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Alle Events
              </button>
              <div className="rounded-2xl overflow-hidden" style={card}>
                {ev.image_url && <img src={ev.image_url} alt={ev.title} loading="lazy" className="w-full max-h-80 object-contain bg-black" />}
                <div className="p-4 space-y-1">
                  <p className="text-lg font-black text-foreground">{ev.title}</p>
                  {ev.subtitle && <p className="text-sm text-muted-foreground">{ev.subtitle}</p>}
                  <p className="text-xs text-muted-foreground">
                    {dateStr(ev.date)} {ev.time ? `· ${ev.time}` : ""}{ev.end_time ? `–${ev.end_time}` : ""}
                    {ev.city ? ` · ${ev.city}` : ""}{ev.location_name ? ` · ${ev.location_name}` : ""}
                  </p>
                  {ev.location_address && <p className="text-xs text-muted-foreground">{ev.location_address}</p>}
                  {ev.description && <p className="pt-2 text-sm text-muted-foreground whitespace-pre-line">{ev.description}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ["Status", ev.status ?? "—"],
                  ["Ausverkauft", ev.sold_out ? "Ja" : "Nein"],
                  ["Open Air", ev.open_air ? "Ja" : "Nein"],
                  ["Ab 16", ev.is_16plus ? "Ja" : "Nein"],
                  ["Muttizettel", ev.muttizettel ? "Ja" : "Nein"],
                  ["Abendkasse", ev.box_office_enabled ? (ev.box_office_price ? eur(Number(ev.box_office_price)) : "Ja") : "Nein"],
                  ["Lounges", ev.lounge_enabled ? "Ja" : "Nein"],
                  ["Versicherung", ev.insurance_enabled ? (ev.insurance_amount ? eur(Number(ev.insurance_amount)) : "Ja") : "Nein"],
                  ["Servicegebühr", ev.service_fee_enabled ? `${ev.service_fee_value ?? 0}${ev.service_fee_type === "percent" ? "%" : " €"}` : "Nein"],
                ].map(([k, v]: any) => (
                  <span key={k} className="rounded-lg px-3 py-1.5 text-xs" style={card}>
                    <span className="text-muted-foreground">{k}: </span>
                    <span className="font-bold text-foreground">{v}</span>
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tickets</p>
                {cats.length === 0 && <p className="text-sm text-muted-foreground">Keine Ticket-Kategorien angelegt.</p>}
                {cats.map((c: any) => {
                  const st = catState(c);
                  return (
                    <div key={c.id} className="rounded-xl p-4 space-y-1" style={card}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {c.name}
                          {c.badge ? <span className="ml-2 text-[10px] uppercase" style={{ color: PURPLE }}>{c.badge}</span> : null}
                        </p>
                        <span className="text-sm font-bold" style={{ color: PURPLE }}>{eur(Number(c.price ?? 0))}</span>
                      </div>
                      {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                      <p className="text-xs" style={{ color: st.color }}>{st.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Verkauf: {c.sale_start ? dateStr(c.sale_start) : "sofort"} – {c.sale_end ? dateStr(c.sale_end) : "offen"}
                        {c.max_capacity ? ` · Kontingent: ${c.max_capacity}` : ""}
                        {c.internal_only ? " · nur intern" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-2">
            {events.map((e: any) => (
              <button
                key={e.id}
                onClick={() => setOpenEvent(e.id)}
                className="w-full rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 text-left transition-colors hover:bg-white/5"
                style={card}
              >
                <div>
                  <p className="font-bold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr(e.date)} {e.time ? `· ${e.time}` : ""} {e.city ? `· ${e.city}` : ""}
                    {e.location_name ? ` · ${e.location_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {e.sold_out && (
                    <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: "hsl(0 60% 55% / 0.15)", color: "hsl(0 70% 65%)" }}>
                      Ausverkauft
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        );
      }
      case "tickets": {
        const t = data.tickets;
        if (!t) return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Tickets gesamt" value={String(t.total)} />
              <Stat label="Bestellungen" value={String(t.orders)} />
              <Stat label="Tickets verfügbar" value={t.available == null ? "—" : String(t.available)} />
              <Stat label="Kontingent" value={t.capacity ? String(t.capacity) : "—"} />
            </div>
            {Object.entries(t.byEvent ?? {}).map(([id, v]: any) => (
              <div key={id} className="rounded-xl p-4 flex flex-wrap justify-between gap-2" style={card}>
                <span className="text-sm text-foreground">{eventTitle[id] ?? "Unbekannt"}</span>
                <span className="text-sm font-bold" style={{ color: PURPLE }}>
                  {v.tickets} verkauft
                  {v.available != null ? ` · ${v.available} verfügbar` : ""}
                </span>
              </div>
            ))}
          </div>
        );
      }
      case "customers": {
        const c = data.customers;
        if (!c) return <p className="text-sm text-muted-foreground">Keine Daten.</p>;
        const entries = Object.entries(c.byEvent ?? {}) as any[];
        if (!entries.length) return <p className="text-sm text-muted-foreground">Noch keine Käufe.</p>;
        return (
          <div className="space-y-5">
            <Stat label="Käufe gesamt" value={String(c.total)} />
            {entries.map(([id, list]: any) => (
              <div key={id} className="space-y-2">
                <p className="text-sm font-black text-foreground">{eventTitle[id] ?? "Unbekannt"}</p>
                {list.map((o: any) => (
                  <div key={o.id} className="rounded-xl p-4 flex flex-wrap justify-between gap-2" style={card}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{o.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {o.email}{o.phone ? ` · ${o.phone}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{dateStr(o.date)}</p>
                    </div>
                    <span className="self-center text-sm font-bold" style={{ color: PURPLE }}>
                      {o.tickets} Ticket{o.tickets === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
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
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {intro && <PartnerIntro />}
      <div className="pp-aurora" />
      <div className="pp-grid" />

      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ borderColor: "hsl(0 0% 100% / 0.07)", background: "hsl(240 20% 4% / 0.55)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={nightlifeLogo} alt="Nightlife Generation" className="h-9 object-contain" style={{ filter: "drop-shadow(0 0 12px hsl(270 80% 60% / 0.6))" }} />
            <div>
              <h1 className="flex items-center gap-2 text-lg font-black pp-gradient-text">
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
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-6">
        {tiles.length === 0 ? (
          <div className="pp-rise rounded-2xl p-10 text-center text-sm text-muted-foreground" style={card}>
            Für deinen Zugang wurden noch keine Bereiche freigeschaltet.
          </div>
        ) : tab ? (
          <div key={tab + (openEvent ?? "")} className="space-y-4 animate-fade-in">
            <button onClick={() => { setTab(null); setOpenEvent(null); }} className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Übersicht
            </button>
            <h2 className="text-2xl font-black pp-gradient-text">
              {PARTNER_PERMISSIONS.find((p) => p.key === tab)?.label}
            </h2>
            {renderDetail()}
          </div>
        ) : (
          <>
            <section
              className="pp-rise relative mb-6 overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-xl"
              style={{
                ...card,
                background: "linear-gradient(135deg, hsl(270 80% 55% / 0.18), hsl(330 85% 60% / 0.10) 55%, hsl(0 0% 100% / 0.03))",
                borderColor: "hsl(270 70% 60% / 0.25)",
                boxShadow: "0 30px 80px -40px hsl(270 80% 55% / 0.8)",
              }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "hsl(270 80% 55% / 0.2)", color: "hsl(285 90% 80%)", border: "1px solid hsl(270 70% 60% / 0.3)" }}>
                <Sparkles className="w-3 h-3" /> Partner Cockpit
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black leading-tight">
                <span className="pp-gradient-text">{greeting}, {firstName}.</span>
                <br />
                <span className="text-foreground">Deine Nacht in Zahlen.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Live-Einblick in Verkäufe, Auslastung und Gäste – exakt für deine Reihen freigeschaltet.
                Kein Rätselraten mehr: Du siehst, was auf der Tanzfläche passiert, bevor die erste Nebelmaschine anspringt.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {heroChips.map((c) => (
                  <span key={c.label} className="rounded-xl px-3 py-2 text-xs backdrop-blur-md" style={card}>
                    <span className="text-muted-foreground">{c.label} </span>
                    <span className="font-black pp-gradient-text">{c.value}</span>
                  </span>
                ))}
              </div>
            </section>

            <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Deine Bereiche</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t, i) => {

              const Icon = ICONS[t.key] ?? CalendarDays;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="pp-tile pp-rise rounded-2xl p-5 text-left backdrop-blur-md"
                  style={{ ...card, animationDelay: `${0.08 * i + (intro ? 2.9 : 0)}s` }}
                >
                  <span
                    className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, hsl(270 80% 55% / 0.25), hsl(330 85% 60% / 0.18))", border: "1px solid hsl(270 70% 55% / 0.3)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: PURPLE }} />
                  </span>
                  <p className="font-black text-foreground">{t.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                </button>
              );
            })}
            </div>
          </>
        )}

      </main>
    </div>
  );

};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="pp-tile pp-rise rounded-xl p-4 backdrop-blur-md" style={card}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-black pp-gradient-text">{value}</p>
  </div>
);

const Bar = ({ value }: { value: number }) => (
  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
    <div
      className="h-full rounded-full transition-[width] duration-1000 ease-out"
      style={{ width: `${value}%`, background: "linear-gradient(90deg, hsl(270 80% 55%), hsl(330 85% 62%))", boxShadow: "0 0 12px hsl(300 80% 60% / 0.6)" }}
    />
  </div>
);


export default PartnerArea;
