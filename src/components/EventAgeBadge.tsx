import { getEventAge } from "@/lib/eventAge";
import { cn } from "@/lib/utils";

export default function EventAgeBadge({ is16plus, className }: { is16plus: boolean | null | undefined; className?: string }) {
  const age = getEventAge(is16plus);
  if (age === null) return null;
  return <span aria-label={`Einlass ab ${age} Jahren`} title={`Einlass ab ${age} Jahren`} className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-foreground text-sm font-extrabold shadow-md", className)}>{age}+</span>;
}