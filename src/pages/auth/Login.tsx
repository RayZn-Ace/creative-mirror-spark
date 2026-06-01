import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Willkommen zurück! 💜");
    nav("/account");
  };

  const onGoogle = async () => {
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/account`,
    });
  };

  return (
    <PageLayout title="Login">
      <div className="container max-w-md py-12">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Login</h1>
          <p className="text-muted-foreground mb-6">Melde dich an für Tickets, Favoriten & mehr</p>

          <Button onClick={onGoogle} variant="outline" className="w-full mb-4">
            Mit Google anmelden
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "..." : "Einloggen"}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Noch kein Account? <Link to="/register" className="text-primary font-semibold">Registrieren</Link>
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}
