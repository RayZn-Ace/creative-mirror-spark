export interface DashboardWidget {
  id: string;
  type: WidgetType;
  colSpan: 1 | 2;
  visible: boolean;
}

export type WidgetType =
  | "stats"
  | "live_events"
  | "quick_actions"
  | "recent_orders"
  | "revenue"
  | "newsletter_stats"
  | "upcoming_events"
  | "checkin_rate"
  | "top_events"
  | "recent_checkins"
  | "sales_chart"
  | "event_calendar"
  | "scanner_activity"
  | "city_breakdown"
  | "avg_order_value"
  | "payment_status"
  | "peak_hours"
  | "age_distribution"
  | "repeat_customers"
  | "service_fee_revenue"
  | "next_event_countdown"
  | "welcome_greeting"
  | "capacity_overview"
  | "revenue_by_event"
  | "geo_heatmap";

export const WIDGET_META: Record<WidgetType, { label: string; description: string; icon: string; defaultW: number; defaultH: number }> = {
  stats: { label: "Statistiken", description: "Übersicht über Serien, Events, Tickets & Seiten", icon: "BarChart3", defaultW: 4, defaultH: 4 },
  live_events: { label: "Heute Live", description: "Laufende Events mit Echtzeit Check-in Zahlen", icon: "Radio", defaultW: 4, defaultH: 5 },
  quick_actions: { label: "Schnellaktionen", description: "Direkt-Links zu häufigen Admin-Aktionen", icon: "Zap", defaultW: 2, defaultH: 4 },
  recent_orders: { label: "Letzte Bestellungen", description: "Die neuesten Ticket-Bestellungen im Überblick", icon: "ShoppingCart", defaultW: 2, defaultH: 5 },
  revenue: { label: "Umsatz-Übersicht", description: "Tages-, Wochen- und Monatsumsätze", icon: "TrendingUp", defaultW: 2, defaultH: 5 },
  newsletter_stats: { label: "Newsletter-Stats", description: "Abonnenten, Neu-Anmeldungen & Abmeldungen", icon: "Mail", defaultW: 2, defaultH: 5 },
  upcoming_events: { label: "Kommende Events", description: "Nächste geplante Events mit Countdown", icon: "CalendarDays", defaultW: 2, defaultH: 5 },
  checkin_rate: { label: "Check-in Quote", description: "Check-in Rate über alle Events der letzten 30 Tage", icon: "UserCheck", defaultW: 2, defaultH: 4 },
  top_events: { label: "Top Events", description: "Bestverkaufte Events nach Ticketanzahl", icon: "Trophy", defaultW: 2, defaultH: 5 },
  recent_checkins: { label: "Letzte Check-ins", description: "Live-Feed der neuesten Ticket-Check-ins", icon: "ScanLine", defaultW: 2, defaultH: 5 },
  sales_chart: { label: "Verkaufs-Chart", description: "Ticket-Verkäufe der letzten 7 Tage als Diagramm", icon: "LineChart", defaultW: 4, defaultH: 5 },
  event_calendar: { label: "Event-Kalender", description: "Monatsübersicht aller geplanten Events", icon: "Calendar", defaultW: 2, defaultH: 5 },
  scanner_activity: { label: "Scanner-Aktivität", description: "Aktive Scanner-Links und deren Status", icon: "QrCode", defaultW: 2, defaultH: 4 },
  city_breakdown: { label: "Städte-Verteilung", description: "Ticketverkäufe aufgeteilt nach Stadt", icon: "MapPin", defaultW: 2, defaultH: 5 },
  avg_order_value: { label: "Ø Bestellwert", description: "Durchschnittlicher Warenkorbwert über Zeit", icon: "Receipt", defaultW: 2, defaultH: 4 },
  payment_status: { label: "Zahlungsstatus", description: "Verteilung der Bestellungen nach Status (bezahlt, ausstehend, abgelaufen)", icon: "CreditCard", defaultW: 2, defaultH: 4 },
  peak_hours: { label: "Peak-Zeiten", description: "Zu welchen Uhrzeiten werden die meisten Tickets gekauft?", icon: "Clock", defaultW: 2, defaultH: 5 },
  age_distribution: { label: "Altersverteilung", description: "Altersgruppen der Ticket-Käufer", icon: "Users", defaultW: 2, defaultH: 5 },
  repeat_customers: { label: "Stammkunden", description: "Kunden die mehrfach bestellt haben", icon: "Heart", defaultW: 2, defaultH: 5 },
  service_fee_revenue: { label: "Servicegebühren", description: "Einnahmen aus Servicegebühren separat", icon: "Coins", defaultW: 2, defaultH: 4 },
  next_event_countdown: { label: "Nächstes Event", description: "Countdown zum nächsten anstehenden Event", icon: "Timer", defaultW: 2, defaultH: 4 },
  welcome_greeting: { label: "Begrüßung", description: "Personalisierte Begrüßung mit Uhrzeit und Datum", icon: "Sparkles", defaultW: 2, defaultH: 3 },
  capacity_overview: { label: "Kapazitäts-Check", description: "Wie viele Tickets sind pro Event noch verfügbar", icon: "Gauge", defaultW: 2, defaultH: 5 },
  revenue_by_event: { label: "Umsatz pro Event", description: "Umsatz-Ranking der Events", icon: "PiggyBank", defaultW: 2, defaultH: 5 },
  geo_heatmap: { label: "Geo-Heatmap", description: "Interaktive Heatmap der Umsätze nach Stadt", icon: "MapPin", defaultW: 4, defaultH: 6 },
};

export const DEFAULT_LAYOUT: DashboardWidget[] = [
  { id: "stats", type: "stats", colSpan: 2, visible: true },
  { id: "live_events", type: "live_events", colSpan: 2, visible: true },
  { id: "recent_orders", type: "recent_orders", colSpan: 1, visible: true },
  { id: "revenue", type: "revenue", colSpan: 1, visible: true },
  { id: "upcoming_events", type: "upcoming_events", colSpan: 1, visible: true },
  { id: "newsletter_stats", type: "newsletter_stats", colSpan: 1, visible: true },
  { id: "quick_actions", type: "quick_actions", colSpan: 2, visible: true },
];
