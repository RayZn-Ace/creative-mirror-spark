import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ReferralWidget() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [alreadyReferred, setAlreadyReferred] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("referral_code, referred_by_code")
        .eq("user_id", user.id)
        .maybeSingle();
      setCode(profile?.referral_code ?? null);
      setAlreadyReferred(!!profile?.referred_by_code);

      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals(refs ?? []);
    })();
  }, [user]);

  const shareUrl = code ? `${window.location.origin}/register?ref=${code}` : "";

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Kopiert! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!navigator.share) return copy(shareUrl);
    try {
      await navigator.share({
        title: "Komm zu Nightlifeticket 🎉",
        text: `Hol dir mit meinem Code ${code} direkt 25 Punkte für deine erste Party!`,
        url: shareUrl,
      });
    } catch {}
  };

  const claim = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_referral", { _code: claimCode.toUpperCase().trim() });
    setClaiming(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const res = data as any;
    if (res?.ok) {
      toast.success("🎉 +25 Punkte! Empfehlung eingelöst.");
      setAlreadyReferred(true);
      setClaimCode("");
    } else {
      const map: Record<string, string> = {
        invalid_code: "Code zu kurz",
        code_not_found: "Code nicht gefunden",
        self_referral: "Du kannst nicht dich selbst empfehlen 😅",
        already_referred: "Du hast bereits einen Code eingelöst",
      };
      toast.error(map[res?.reason] || "Konnte nicht eingelöst werden");
    }
  };

  return (
    <Card className="p-6 space-y-5 bg-gradient-to-br from-primary/10 via-card to-card border-primary/30">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Lade Freunde ein</h2>
          <p className="text-xs text-muted-foreground">Du bekommst 50 Punkte, dein Freund 25 Punkte ✨</p>
        </div>
      </div>

      {code && (
        <>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Dein Code</div>
            <div className="flex gap-2">
              <Input value={code} readOnly className="font-mono font-bold text-lg tracking-widest text-center" />
              <Button variant="outline" size="icon" onClick={() => copy(code)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Dein Einladungs-Link</div>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button onClick={share}><Share2 className="h-4 w-4 mr-2" /> Teilen</Button>
            </div>
          </div>

          <div className="text-sm">
            <span className="font-semibold">{referrals.length}</span>{" "}
            <span className="text-muted-foreground">{referrals.length === 1 ? "Freund geworben" : "Freunde geworben"}</span>
          </div>
        </>
      )}

      {!alreadyReferred && (
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-1.5">Hast du einen Code bekommen?</div>
          <div className="flex gap-2">
            <Input
              placeholder="z.B. AB12CD34"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              maxLength={10}
            />
            <Button variant="secondary" onClick={claim} disabled={claiming || claimCode.length < 4}>
              Einlösen
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
