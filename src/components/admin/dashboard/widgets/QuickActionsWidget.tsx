const QuickActionsWidget = () => (
  <div className="grid grid-cols-1 gap-2">
    {[
      { href: "/admin/series", label: "+ Neue Event-Serie", color: "hsl(270 60% 55%)" },
      { href: "/admin/events", label: "+ Neues Event", color: "hsl(330 80% 55%)" },
      { href: "/admin/pages", label: "Seiten bearbeiten", color: "hsl(45 80% 55%)" },
    ].map((a) => (
      <a
        key={a.href}
        href={a.href}
        className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
        style={{ background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30` }}
      >
        {a.label}
      </a>
    ))}
  </div>
);

export default QuickActionsWidget;
