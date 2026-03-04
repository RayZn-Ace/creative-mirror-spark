import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Ticket, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getGlobalTranslations, type GlobalTranslations } from "@/lib/i18n";

interface DropdownItem {
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  items: DropdownItem[];
}

function buildNav(gt: GlobalTranslations) {
  const directLinks = [
    { label: gt.navHome, path: "/" },
    { label: gt.navDatesTickets, path: "/termine" },
  ];

  const groups: NavGroup[] = [
    {
      label: gt.navExperience,
      items: [
        { label: gt.navForWho, path: "/ueber-uns" },
        { label: gt.navMedia, path: "/fotos" },
        { label: gt.navBlog, path: "/vergangene-events" },
      ],
    },
    {
      label: gt.navCollaboration,
      items: [
        { label: gt.navBookUs, path: "/kontakt" },
        { label: gt.navRegisterLocation, path: "/kontakt" },
        { label: gt.navPartner, path: "/promoter" },
        { label: gt.navInfluencer, path: "/kontakt" },
        { label: gt.navJobs, path: "/jobs" },
      ],
    },
  ];

  const extraLinks = [
    { label: gt.navFaqSupport, path: "/faq" },
    { label: gt.navTicketRebooking, path: "/kontakt" },
  ];

  return { directLinks, groups, extraLinks };
}

function DesktopDropdown({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const location = useLocation();

  const enter = () => { clearTimeout(timeout.current); setOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setOpen(false), 150); };
  const isActive = group.items.some((i) => location.pathname === i.path);

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        className={`flex items-center gap-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium rounded-md transition-colors ${
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[180px] rounded-lg border border-border bg-card/95 backdrop-blur-xl shadow-lg overflow-hidden z-50"
          >
            {group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 text-sm transition-colors ${
                  location.pathname === item.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ gt: gtProp }: { gt?: GlobalTranslations }) {
  const gt = gtProp || getGlobalTranslations();
  const { directLinks, groups, extraLinks } = buildNav(gt);
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container relative flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="text-2xl md:text-3xl font-display bg-clip-text text-transparent select-none group-hover:opacity-80 transition-opacity" style={{ backgroundImage: "var(--gradient-primary)" }}>
            GIMME GIMME PARTY
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0 xl:gap-0.5 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          {directLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {groups.map((group) => (
            <DesktopDropdown key={group.label} group={group} />
          ))}
          {extraLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            to="/meine-tickets"
            className="px-3 py-2 text-xs xl:text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            {gt.navMyTickets}
          </Link>
          <Link
            to="/termine"
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm animate-pulse-glow hover:opacity-90 transition-opacity"
          >
            <Ticket className="w-4 h-4" />
            {gt.navTickets}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-foreground" aria-label="Menü öffnen">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-1">
              {directLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {groups.map((group) => (
                <div key={group.label}>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === group.label ? null : group.label)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {group.label}
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpanded === group.label ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileExpanded === group.label && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        {group.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpen(false)}
                            className={`block pl-8 pr-4 py-2.5 text-sm transition-colors ${
                              location.pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {extraLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                to="/meine-tickets"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/meine-tickets" ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {gt.navMyTickets}
              </Link>

              <Link
                to="/termine"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm"
              >
                <Ticket className="w-4 h-4" />
                {gt.navTickets}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
