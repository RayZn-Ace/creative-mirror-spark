import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import nightlifeLogo from "@/assets/nightlife-generation-logo.png";

type UnsubscribeState = "loading" | "success" | "error";

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<UnsubscribeState>("loading");

  useEffect(() => {
    document.title = "Newsletter abmelden | Nightlife Generation";
  }, []);

  useEffect(() => {
    const email = searchParams.get("email")?.trim();
    if (!email) {
      setState("error");
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-unsubscribe`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          },
        );
        setState(response.ok ? "success" : "error");
      } catch {
        setState("error");
      }
    };

    void unsubscribe();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-md border border-border bg-card p-8 text-center shadow-xl">
        <img src={nightlifeLogo} alt="Nightlife Generation" className="mx-auto mb-8 h-12 w-auto" />

        {state === "loading" && (
          <>
            <Loader2 className="mx-auto mb-5 h-12 w-12 animate-spin text-primary" />
            <h1 className="mb-3 text-3xl font-display uppercase text-foreground">Wird abgemeldet</h1>
            <p className="text-sm text-muted-foreground">Einen kurzen Moment bitte.</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-primary" />
            <h1 className="mb-3 text-3xl font-display uppercase text-foreground">Du bist abgemeldet</h1>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Du erhältst ab sofort keine weiteren Newsletter von uns.
            </p>
            <Link to="/" className="inline-flex min-h-11 items-center justify-center bg-gradient-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground">
              Zur Startseite
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <MailX className="mx-auto mb-5 h-12 w-12 text-destructive" />
            <h1 className="mb-3 text-3xl font-display uppercase text-foreground">Link nicht gültig</h1>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Die Abmeldung konnte nicht abgeschlossen werden. Schreib uns bitte kurz über den Support.
            </p>
            <Link to="/kontakt" className="inline-flex min-h-11 items-center justify-center bg-gradient-primary px-6 py-3 text-sm font-bold uppercase text-primary-foreground">
              Zum Support
            </Link>
          </>
        )}
        <p className="mt-8 text-xs text-muted-foreground">
          Nightlife Generation · nightlifeticket.app
        </p>
      </section>
    </main>
  );
}