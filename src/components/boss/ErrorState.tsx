import { useEffect, useRef } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/lib/toast";

function messageOf(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

/** Inline, accessible error state used by walls, cards and sections. */
export function ErrorBanner({
  title = "Something went wrong",
  error,
  onRetry,
  className = "",
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col gap-2 rounded-lg border border-[color:color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_7%,transparent)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-destructive">{title}</div>
          <div className="text-[11.5px] text-muted-foreground">
            {messageOf(error, "Please retry in a moment.")}
          </div>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}

/**
 * Fires one destructive toast per new fetch failure so an error is never
 * silently replaced by fallback text.
 */
export function useErrorToast(error: unknown, context: string) {
  const { toast } = useToast();
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!error) {
      lastRef.current = null;
      return;
    }
    const msg = messageOf(error, "Unexpected error");
    if (lastRef.current === msg) return;
    lastRef.current = msg;
    toast({ title: `${context} failed to load`, description: msg, tone: "destructive" });
  }, [error, context, toast]);
}

export { messageOf as errorMessage };
