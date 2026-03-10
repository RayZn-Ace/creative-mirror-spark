import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AdminRegister = () => {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // The invite link triggers a SIGNED_IN event with type=invite
    // We listen for the session to extract the user's email
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setEmail(session.user.email || "");
          setReady(true);

          // Check if user already has a password set (i.e. already registered)
          // If they have user_metadata with display_name, they already completed registration
          if (session.user.user_metadata?.display_name) {
            navigate("/admin", { replace: true });
          }
        }
      }
    );

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email || "");
        setReady(true);
        if (session.user.user_metadata?.display_name) {
          navigate("/admin", { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (!displayName.trim()) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }

    setLoading(true);
    try {
      // Update password and user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { display_name: displayName.trim() },
      });

      if (updateError) throw updateError;

      // Also update profile display_name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles")
          .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      toast.success("Registrierung erfolgreich! 🎉");
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message || "Fehler bei der Registrierung");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "hsl(270 70% 55%)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Einladung wird verarbeitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "hsl(220 50% 8%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-black uppercase tracking-wider mb-2"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(270 70% 55%)" }}
          >
            Willkommen!
          </h1>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Vervollständige deine Registrierung
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "hsl(0 0% 100% / 0.04)",
            border: "1px solid hsl(0 0% 100% / 0.08)",
          }}
        >
          {error && (
            <div className="text-sm text-center py-2 px-3 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 65%)" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              Dein Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.15)",
              }}
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-not-allowed"
              style={{
                background: "hsl(0 0% 100% / 0.04)",
                color: "hsl(0 0% 100% / 0.5)",
                border: "1px solid hsl(0 0% 100% / 0.1)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.15)",
              }}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.15)",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{
              background: "hsl(270 70% 55%)",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 4px 20px hsl(270 70% 55% / 0.3)",
            }}
          >
            {loading ? "Wird registriert..." : "Registrierung abschließen"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminRegister;
