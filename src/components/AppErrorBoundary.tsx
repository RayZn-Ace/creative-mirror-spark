import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { requestSafeReload } from "@/lib/reloadSafety";

interface Props {
  children: ReactNode;
  /** Render nothing instead of a full screen (for non-essential subtrees). */
  silent?: boolean;
}

interface State {
  hasError: boolean;
}

/**
 * Keeps a render-time exception from turning into a blank/instantly closing
 * screen in the native app. Shows a minimal branded retry screen instead.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("App render failed");
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.silent) return null;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-bold">Da ist was schiefgelaufen</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Bei laufendem Kauf, Einlass oder Muttizettel bitte nicht neu laden. Prüfe zuerst den Vorgang oder kontaktiere uns.
        </p>
        <Button
          onClick={() => requestSafeReload()}
          className="rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground"
        >
          Neu laden
        </Button>
      </div>
    );
  }
}
