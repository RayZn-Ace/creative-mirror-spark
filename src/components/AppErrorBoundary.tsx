import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
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
    console.error("App crashed during render", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-bold">Da ist was schiefgelaufen</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Bitte lade die Seite neu. Wenn es weiterhin nicht klappt, schreib uns kurz.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground"
        >
          Neu laden
        </button>
      </div>
    );
  }
}
