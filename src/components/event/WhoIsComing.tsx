import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface Props {
  eventId?: string | null;
  className?: string;
}

export default function WhoIsComing({ eventId, className }: Props) {
  const { user } = useAuth();
  const { totalCount, friendsGoing, loading } = useEventAttendance(eventId);

  if (!eventId || loading) return null;
  if (totalCount === 0 && friendsGoing.length === 0) return null;

  return (
    <div className={`rounded-2xl border bg-card p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2 text-sm font-semibold mb-3">
        <Users className="h-4 w-4 text-primary" />
        Wer kommt noch?
      </div>

      {totalCount > 0 && (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-primary">{totalCount}</span>
          <span className="text-sm text-muted-foreground">
            {totalCount === 1 ? "Person ist dabei" : "Personen sind dabei"} 🔥
          </span>
        </div>
      )}

      {user ? (
        friendsGoing.length > 0 ? (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Aus deinem Squad: <span className="font-semibold text-foreground">{friendsGoing.length}</span>
            </div>
            <div className="flex -space-x-2">
              {friendsGoing.slice(0, 8).map((f) => (
                <Avatar key={f.user_id} className="border-2 border-card h-9 w-9">
                  <AvatarImage src={f.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(f.display_name || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {friendsGoing.length > 8 && (
                <div className="h-9 w-9 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-semibold">
                  +{friendsGoing.length - 8}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Noch keiner aus deinem Squad – sei der erste 😎{" "}
            <Link to="/account/friends" className="text-primary underline">Squad managen</Link>
          </div>
        )
      ) : (
        <div className="text-xs text-muted-foreground">
          <Link to="/login" className="text-primary underline">Login</Link>, um zu sehen welche Freunde kommen.
        </div>
      )}
    </div>
  );
}
