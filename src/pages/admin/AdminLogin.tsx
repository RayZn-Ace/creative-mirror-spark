import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect when user is authenticated and admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("Ungültige Anmeldedaten");
      setLoading(false);
    }
    // Don't setLoading(false) on success - the useEffect will navigate
  };

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
            Admin Panel
          </h1>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Gimme Gimme Party Verwaltung
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
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "hsl(0 0% 100% / 0.08)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.15)",
              }}
              placeholder="admin@example.com"
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
            {loading ? "Anmelden..." : "Anmelden"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
