import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = useRef<string | null>(null);

  const checkAdmin = (userId: string) => {
    setIsAdmin(false);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        if (currentUser.current !== userId) return;
        if (error) {
          console.error("Error checking admin role:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    // Safety net: never keep the app in a loading state if the auth/storage
    // layer stalls (can happen in the native webview without network).
    const failsafe = window.setTimeout(() => setLoading(false), 6000);

    // First get existing session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        currentUser.current = session?.user.id ?? null;
        if (session?.user) {
          void supabase.rpc("claim_customer_orders");
          checkAdmin(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((e) => {
        console.warn("Session konnte nicht geladen werden", e);
        setLoading(false);
      });

    // Then listen for changes - DO NOT use await inside this callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        currentUser.current = session?.user.id ?? null;
        if (session?.user) {
          // Leave the auth callback before issuing further auth-backed calls.
          const userId = session.user.id;
          setTimeout(() => {
            if (currentUser.current !== userId) return;
            void supabase.rpc("claim_customer_orders");
            checkAdmin(userId);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => {
      window.clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
