import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";

export default function Register() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = params.get("ref");
    if (r) {
      const upper = r.toUpperCase();
      setRefCode(upper);
      localStorage.setItem("pending_ref_code", upper);
    } else {
      const stored = localStorage.getItem("pending_ref_code");
      if (stored) setRefCode(stored);
    }
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { display_name: name, name, ref_code: refCode || null },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (refCode) localStorage.setItem("pending_ref_code", refCode);
    toast.success("Check deine Mails zur Bestätigung 📬");
    nav("/login");
  };

  const onGoogle = async () => {
    if (refCode) localStorage.setItem("pending_ref_code", refCode);
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/account`,
    });
  };

  return (
    <PageLayout title="Registrieren">
      <div className="container max-w-md py-12">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Account erstellen</h1>
          <p className="text-muted-foreground mb-6">Speichere Events, verwalte Tickets, bleib up to date</p>

          {refCode && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2 text-sm">
              <Gift className="h-4 w-4 text-primary" />
              <span>Eingeladen mit Code <strong className="font-mono">{refCode}</strong> – du bekommst <strong>+25 Punkte</strong> ✨</span>
            </div>
          )}

          <Button onClick={onGoogle} variant="outline" className="w-full mb-4">
            Mit Google registrieren
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Passwort (min. 6 Zeichen)</Label>
              <Input id="password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ref">Empfehlungs-Code (optional)</Label>
              <Input id="ref" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder="z.B. AB12CD34" className="font-mono uppercase" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "..." : "Account erstellen"}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Schon dabei? <Link to="/login" className="text-primary font-semibold">Login</Link>
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}
