import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

const WelcomeGreetingWidget = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  const email = user?.email ?? "";
  const name = email.split("@")[0].split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const now = new Date();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <Sparkles className="w-5 h-5 mb-0.5" style={{ color: "hsl(45 80% 55%)" }} />
      <span className="text-sm font-black" style={{ color: "hsl(0 0% 100%)" }}>{greeting}, {name}!</span>
      <span className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
        {now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </span>
      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
        {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
      </span>
    </div>
  );
};

export default WelcomeGreetingWidget;
