import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GridLayout, { useContainerWidth, verticalCompactor } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Pencil, Check, Plus, X, BarChart3, Radio, Zap, ShoppingCart, TrendingUp, Mail, CalendarDays, UserCheck, Trophy, ScanLine, LineChart, Calendar, QrCode, MapPin, Receipt, CreditCard, Clock, Users, Heart, Coins, Timer, Sparkles, Gauge, PiggyBank } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetType, WIDGET_META } from "@/components/admin/dashboard/types";

const StatsWidget = lazy(() => import("@/components/admin/dashboard/widgets/StatsWidget"));
const LiveEventsWidget = lazy(() => import("@/components/admin/dashboard/widgets/LiveEventsWidget"));
const QuickActionsWidget = lazy(() => import("@/components/admin/dashboard/widgets/QuickActionsWidget"));
const RecentOrdersWidget = lazy(() => import("@/components/admin/dashboard/widgets/RecentOrdersWidget"));
const RevenueWidget = lazy(() => import("@/components/admin/dashboard/widgets/RevenueWidget"));
const NewsletterStatsWidget = lazy(() => import("@/components/admin/dashboard/widgets/NewsletterStatsWidget"));
const UpcomingEventsWidget = lazy(() => import("@/components/admin/dashboard/widgets/UpcomingEventsWidget"));
const CheckinRateWidget = lazy(() => import("@/components/admin/dashboard/widgets/CheckinRateWidget"));
const TopEventsWidget = lazy(() => import("@/components/admin/dashboard/widgets/TopEventsWidget"));
const RecentCheckinsWidget = lazy(() => import("@/components/admin/dashboard/widgets/RecentCheckinsWidget"));
const SalesChartWidget = lazy(() => import("@/components/admin/dashboard/widgets/SalesChartWidget"));
const EventCalendarWidget = lazy(() => import("@/components/admin/dashboard/widgets/EventCalendarWidget"));
const ScannerActivityWidget = lazy(() => import("@/components/admin/dashboard/widgets/ScannerActivityWidget"));

const AvgOrderValueWidget = lazy(() => import("@/components/admin/dashboard/widgets/AvgOrderValueWidget"));
const PaymentStatusWidget = lazy(() => import("@/components/admin/dashboard/widgets/PaymentStatusWidget"));
const PeakHoursWidget = lazy(() => import("@/components/admin/dashboard/widgets/PeakHoursWidget"));
const AgeDistributionWidget = lazy(() => import("@/components/admin/dashboard/widgets/AgeDistributionWidget"));
const RepeatCustomersWidget = lazy(() => import("@/components/admin/dashboard/widgets/RepeatCustomersWidget"));
const ServiceFeeRevenueWidget = lazy(() => import("@/components/admin/dashboard/widgets/ServiceFeeRevenueWidget"));
const NextEventCountdownWidget = lazy(() => import("@/components/admin/dashboard/widgets/NextEventCountdownWidget"));
const WelcomeGreetingWidget = lazy(() => import("@/components/admin/dashboard/widgets/WelcomeGreetingWidget"));
const CapacityOverviewWidget = lazy(() => import("@/components/admin/dashboard/widgets/CapacityOverviewWidget"));
const RevenueByEventWidget = lazy(() => import("@/components/admin/dashboard/widgets/RevenueByEventWidget"));
const GeoHeatmapWidget = lazy(() => import("@/components/admin/dashboard/widgets/GeoHeatmapWidget"));

const WIDGET_COMPONENTS: Record<WidgetType, React.LazyExoticComponent<React.ComponentType>> = {
  stats: StatsWidget,
  live_events: LiveEventsWidget,
  quick_actions: QuickActionsWidget,
  recent_orders: RecentOrdersWidget,
  revenue: RevenueWidget,
  newsletter_stats: NewsletterStatsWidget,
  upcoming_events: UpcomingEventsWidget,
  checkin_rate: CheckinRateWidget,
  top_events: TopEventsWidget,
  recent_checkins: RecentCheckinsWidget,
  sales_chart: SalesChartWidget,
  event_calendar: EventCalendarWidget,
  scanner_activity: ScannerActivityWidget,
  city_breakdown: CityBreakdownWidget,
  avg_order_value: AvgOrderValueWidget,
  payment_status: PaymentStatusWidget,
  peak_hours: PeakHoursWidget,
  age_distribution: AgeDistributionWidget,
  repeat_customers: RepeatCustomersWidget,
  service_fee_revenue: ServiceFeeRevenueWidget,
  next_event_countdown: NextEventCountdownWidget,
  welcome_greeting: WelcomeGreetingWidget,
  capacity_overview: CapacityOverviewWidget,
  revenue_by_event: RevenueByEventWidget,
  geo_heatmap: GeoHeatmapWidget,
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BarChart3, Radio, Zap, ShoppingCart, TrendingUp, Mail, CalendarDays, UserCheck, Trophy, ScanLine, LineChart, Calendar, QrCode,
  MapPin, Receipt, CreditCard, Clock, Users, Heart, Coins, Timer, Sparkles, Gauge, PiggyBank,
};

const DEFAULT_GRID: Layout = [
  { i: "stats", x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
  { i: "live_events", x: 0, y: 4, w: 4, h: 5, minW: 2, minH: 3 },
  { i: "recent_orders", x: 0, y: 9, w: 2, h: 5, minW: 2, minH: 3 },
  { i: "revenue", x: 2, y: 9, w: 2, h: 5, minW: 2, minH: 3 },
  { i: "upcoming_events", x: 0, y: 14, w: 2, h: 5, minW: 2, minH: 3 },
  { i: "newsletter_stats", x: 2, y: 14, w: 2, h: 5, minW: 2, minH: 3 },
  { i: "quick_actions", x: 0, y: 19, w: 4, h: 4, minW: 2, minH: 3 },
];

const ALL_WIDGET_TYPES: WidgetType[] = Object.keys(WIDGET_META) as WidgetType[];

interface SavedLayout { grid: Layout; hidden: string[]; }

const Dashboard = () => {
  const { user } = useAuth();
  const [gridLayout, setGridLayout] = useState<Layout>(DEFAULT_GRID);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const { width, containerRef, mounted } = useContainerWidth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("dashboard_layouts")
      .select("layout")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.layout && typeof data.layout === "object" && !Array.isArray(data.layout)) {
          const saved = data.layout as unknown as SavedLayout;
          if (saved.grid?.length) setGridLayout(saved.grid.map(g => ({ ...g, minW: g.minW ?? 2, minH: g.minH ?? 2 })));
          if (saved.hidden) setHiddenWidgets(saved.hidden);
        }
        setLoaded(true);
      });
  }, [user]);

  const saveLayout = useCallback(async (grid: Layout, hidden: string[]) => {
    if (!user) return;
    await supabase
      .from("dashboard_layouts")
      .upsert({ user_id: user.id, layout: { grid, hidden } as any, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  }, [user]);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setGridLayout(prev => newLayout.map(nl => {
      const existing = prev.find(p => p.i === nl.i);
      return { ...nl, minW: existing?.minW ?? 2, minH: existing?.minH ?? 2 };
    }));
  }, []);

  const handleSave = () => { saveLayout(gridLayout, hiddenWidgets); setEditing(false); setShowAddPanel(false); };

  const removeWidget = (id: string) => {
    setHiddenWidgets(prev => [...prev, id]);
    setGridLayout(prev => prev.filter(g => g.i !== id));
  };

  const addWidget = (type: WidgetType) => {
    setHiddenWidgets(prev => prev.filter(h => h !== type));
    const meta = WIDGET_META[type];
    const maxY = gridLayout.reduce((max, g) => Math.max(max, g.y + g.h), 0);
    setGridLayout(prev => [...prev, { i: type, x: 0, y: maxY, w: meta.defaultW, h: meta.defaultH, minW: 2, minH: 2 }]);
    setShowAddPanel(false);
  };

  const visibleGrid = gridLayout.filter(g => !hiddenWidgets.includes(g.i));
  const availableWidgets = ALL_WIDGET_TYPES.filter(t => !visibleGrid.find(g => g.i === t));

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Dashboard
        </h1>
        <div className="flex items-center gap-2">
          {editing && (
            <button
              onClick={() => setShowAddPanel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
              style={{ background: "hsl(270 60% 55% / 0.15)", color: "hsl(270 60% 55%)", border: "1px solid hsl(270 60% 55% / 0.3)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Kachel
            </button>
          )}
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: editing ? "hsl(140 60% 50% / 0.15)" : "hsl(0 0% 100% / 0.06)",
              color: editing ? "hsl(140 60% 50%)" : "hsl(0 0% 100% / 0.6)",
              border: `1px solid ${editing ? "hsl(140 60% 50% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
            }}
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editing ? "Speichern" : "Bearbeiten"}
          </button>
        </div>
      </div>

      {/* Add Widget Panel (Modal overlay) */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddPanel(false)}
          >
            <div className="absolute inset-0" style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl p-5"
              style={{ background: "hsl(220 40% 14%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>Kachel hinzufügen</h2>
                <button onClick={() => setShowAddPanel(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.5)" }} />
                </button>
              </div>

              {availableWidgets.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Alle Kacheln sind bereits auf dem Dashboard 🎉
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableWidgets.map((type) => {
                    const meta = WIDGET_META[type];
                    const IconComp = ICON_MAP[meta.icon];
                    return (
                      <button
                        key={type}
                        onClick={() => addWidget(type)}
                        className="flex items-start gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02] group"
                        style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: "hsl(270 60% 55% / 0.15)" }}
                        >
                          {IconComp && <IconComp className="w-4 h-4" style={{ color: "hsl(270 60% 55%)" }} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold mb-0.5" style={{ color: "hsl(0 0% 100% / 0.9)" }}>{meta.label}</p>
                          <p className="text-[10px] leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{meta.description}</p>
                        </div>
                        <Plus className="w-4 h-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(270 60% 55%)" }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div ref={containerRef} className="dashboard-grid-container">
        {mounted && (
          <GridLayout
            layout={visibleGrid}
            width={width}
            gridConfig={{ cols: 4, rowHeight: 40 }}
            dragConfig={{ enabled: editing, bounded: false, threshold: 3 }}
            resizeConfig={{ enabled: editing, handles: ["se"] }}
            onLayoutChange={handleLayoutChange}
            compactor={verticalCompactor}
          >
            {visibleGrid.map((item) => {
              const type = item.i as WidgetType;
              const Comp = WIDGET_COMPONENTS[type];
              if (!Comp) return null;
              return (
                <div
                  key={item.i}
                  className="rounded-xl sm:rounded-2xl overflow-hidden h-full"
                  style={{
                    background: "hsl(0 0% 100% / 0.04)",
                    border: editing ? "1px dashed hsl(270 60% 55% / 0.3)" : "1px solid hsl(0 0% 100% / 0.08)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                      {WIDGET_META[type]?.label}
                    </span>
                    {editing && (
                      <button onClick={(e) => { e.stopPropagation(); removeWidget(item.i); }} className="p-1 rounded hover:bg-white/10 transition-colors">
                        <X className="w-3 h-3" style={{ color: "hsl(0 60% 55%)" }} />
                      </button>
                    )}
                  </div>
                  <div className={`p-3 sm:p-4 overflow-auto ${editing ? "pointer-events-none opacity-50" : ""}`} style={{ height: "calc(100% - 28px)" }}>
                    <Suspense fallback={<WidgetSkeleton />}>
                      <Comp />
                    </Suspense>
                  </div>
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>
    </div>
  );
};

const WidgetSkeleton = () => (
  <div className="space-y-2">
    <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
    <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
  </div>
);

export default Dashboard;
