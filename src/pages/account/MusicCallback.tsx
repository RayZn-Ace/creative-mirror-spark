import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MusicCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("Verbinde mit Spotify...");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const err = params.get("error");
    if (err) {
      setState("error");
      setMsg(`Abgebrochen: ${err}`);
      return;
    }
    if (!code) {
      setState("error");
      setMsg("Kein Code erhalten");
      return;
    }

    (async () => {
      const redirect_uri = `${window.location.origin}/account/music/callback`;
      const { data, error } = await supabase.functions.invoke("spotify-callback", {
        body: { code, redirect_uri },
      });
      if (error || data?.error) {
        setState("error");
        setMsg(data?.error || error?.message || "Fehler beim Verbinden");
        return;
      }
      setState("ok");
      setMsg(`Yo ${data?.display_name || ""} — Spotify verbunden! 🎧`);
      toast.success("Spotify verbunden");
      setTimeout(() => navigate("/account/profile"), 1500);
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center">
        {state === "loading" && <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />}
        {state === "ok" && <CheckCircle2 className="h-10 w-10 mx-auto mb-4 text-green-500" />}
        {state === "error" && <XCircle className="h-10 w-10 mx-auto mb-4 text-destructive" />}
        <p className="text-lg font-medium">{msg}</p>
      </Card>
    </div>
  );
}
