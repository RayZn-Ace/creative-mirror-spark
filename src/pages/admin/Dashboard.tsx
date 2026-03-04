import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Pencil, Check, Plus, X, GripVertical, Columns2, Columns3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardWidget, WidgetType, WIDGET_META, DEFAULT_LAYOUT } from "@/components/admin/dashboard/types";

// Lazy load widgets
const StatsWidget = lazy(() => import("@/components/admin/dashboard/widgets/StatsWidget"));
const LiveEventsWidget = lazy(() => import("@/components/admin/dashboard/widgets/LiveEventsWidget"));
const QuickActionsWidget = lazy(() => import("@/components/admin/dashboard/widgets/QuickActionsWidget"));
const RecentOrdersWidget = lazy(() => import("@/components/admin/dashboard/widgets/RecentOrdersWidget"));
const RevenueWidget = lazy(() => import("@/components/admin/dashboard/widgets/RevenueWidget"));
const NewsletterStatsWidget = lazy(() => import("@/components/admin/dashboard/widgets/NewsletterStatsWidget"));
const UpcomingEventsWidget = lazy(() => import("@/components/admin/dashboard/widgets/UpcomingEventsWidget"));

const WIDGET_COMPONENTS: Record<WidgetType, React.LazyExoticComponent<React.ComponentType>> = {
  stats: StatsWidget,
  live_events: LiveEventsWidget,
  quick_actions: QuickActionsWidget,
  recent_orders: RecentOrdersWidget,
  revenue: RevenueWidget,
  newsletter_stats: NewsletterStatsWidget,
  upcoming_events: UpcomingEventsWidget,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved layout
  useEffect(() => {
    if (!user) return;
    supabase
      .from("dashboard_layouts")
      .select("layout")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.layout && Array.isArray(data.layout) && data.layout.length > 0) {
          // Merge with defaults to catch new widgets
          const saved = (data.layout as unknown) as DashboardWidget[];
          const savedIds = new Set(saved.map((w) => w.id));
          const merged = [
            ...saved,
            ...DEFAULT_LAYOUT.filter((w) => !savedIds.has(w.id)).map((w) => ({ ...w, visible: false })),
          ];
          setLayout(merged);
        }
        setLoaded(true);
      });
  }, [user]);

  // Save layout
  const saveLayout = useCallback(
    async (newLayout: DashboardWidget[]) => {
      if (!user) return;
      const { error } = await supabase
        .from("dashboard_layouts")
        .upsert({ user_id: user.id, layout: newLayout as any, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) console.error("Save layout error:", error);
    },
    [user]
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(layout);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setLayout(items);
  };

  const toggleWidget = (id: string) => {
    setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const toggleColSpan = (id: string) => {
    setLayout((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w))
    );
  };

  const handleSave = () => {
    saveLayout(layout);
    setEditing(false);
  };

  const visibleWidgets = layout.filter((w) => w.visible);
  const hiddenWidgets = layout.filter((w) => !w.visible);

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
        <h1
          className="text-lg sm:text-2xl font-black uppercase"
          style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
        >
          Dashboard
        </h1>
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

      {/* Hidden widgets drawer (edit mode) */}
      <AnimatePresence>
        {editing && hiddenWidgets.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div
              className="rounded-xl p-3"
              style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px dashed hsl(0 0% 100% / 0.12)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                Ausgeblendete Kacheln
              </span>
              <div className="flex flex-wrap gap-2">
                {hiddenWidgets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => toggleWidget(w.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                  >
                    <Plus className="w-3 h-3" />
                    {WIDGET_META[w.type].label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget grid */}
      {editing ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 gap-2 sm:gap-3"
              >
                {visibleWidgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="rounded-xl sm:rounded-2xl overflow-hidden transition-shadow"
                        style={{
                          ...provided.draggableProps.style,
                          gridColumn: `span ${widget.colSpan}`,
                          background: "hsl(0 0% 100% / 0.04)",
                          border: snapshot.isDragging
                            ? "2px solid hsl(270 60% 55% / 0.5)"
                            : "1px solid hsl(0 0% 100% / 0.08)",
                          boxShadow: snapshot.isDragging ? "0 8px 32px hsl(0 0% 0% / 0.4)" : "none",
                        }}
                      >
                        {/* Edit toolbar */}
                        <div
                          className="flex items-center justify-between px-3 py-2"
                          style={{ background: "hsl(0 0% 100% / 0.03)", borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
                        >
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-0.5">
                              <GripVertical className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                              {WIDGET_META[widget.type].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleColSpan(widget.id)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                              title={widget.colSpan === 1 ? "Breit machen" : "Schmal machen"}
                            >
                              {widget.colSpan === 1 ? (
                                <Columns2 className="w-3.5 h-3.5" style={{ color: "hsl(200 80% 55%)" }} />
                              ) : (
                                <Columns3 className="w-3.5 h-3.5" style={{ color: "hsl(200 80% 55%)" }} />
                              )}
                            </button>
                            <button
                              onClick={() => toggleWidget(widget.id)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" style={{ color: "hsl(0 60% 55%)" }} />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 opacity-50 pointer-events-none">
                          <Suspense fallback={<WidgetSkeleton />}>
                            {(() => { const C = WIDGET_COMPONENTS[widget.type]; return <C />; })()}
                          </Suspense>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {visibleWidgets.map((widget, i) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl sm:rounded-2xl p-3 sm:p-4"
              style={{
                gridColumn: `span ${widget.colSpan}`,
                background: "hsl(0 0% 100% / 0.04)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  {WIDGET_META[widget.type].label}
                </span>
              </div>
              <Suspense fallback={<WidgetSkeleton />}>
                {(() => { const C = WIDGET_COMPONENTS[widget.type]; return <C />; })()}
              </Suspense>
            </motion.div>
          ))}
        </div>
      )}
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
