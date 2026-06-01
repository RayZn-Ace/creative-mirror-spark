import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface Props {
  eventId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({ eventId, className, size = "md" }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(eventId);
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "rounded-full backdrop-blur-md bg-background/60 hover:bg-background/80 border border-border/50",
        sizes[size],
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(eventId);
      }}
      aria-label={fav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
    >
      <Heart
        className={cn(iconSizes[size], "transition-all", fav && "fill-primary text-primary scale-110")}
      />
    </Button>
  );
}
