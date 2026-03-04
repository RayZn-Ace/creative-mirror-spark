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
  | "upcoming_events";

export const WIDGET_META: Record<WidgetType, { label: string; icon: string; defaultColSpan: 1 | 2 }> = {
  stats: { label: "Statistiken", icon: "BarChart3", defaultColSpan: 2 },
  live_events: { label: "Heute Live", icon: "Radio", defaultColSpan: 2 },
  quick_actions: { label: "Schnellaktionen", icon: "Zap", defaultColSpan: 1 },
  recent_orders: { label: "Letzte Bestellungen", icon: "ShoppingCart", defaultColSpan: 1 },
  revenue: { label: "Umsatz-Übersicht", icon: "TrendingUp", defaultColSpan: 1 },
  newsletter_stats: { label: "Newsletter-Stats", icon: "Mail", defaultColSpan: 1 },
  upcoming_events: { label: "Kommende Events", icon: "CalendarDays", defaultColSpan: 1 },
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
