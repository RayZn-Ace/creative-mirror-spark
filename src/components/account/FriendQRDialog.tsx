import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, QrCode, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriends";

const PAYLOAD_PREFIX = "nlg-friend:";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseFriendPayload(text: string): string | null {
  if (!text) return null;
  const t = text.trim();
  if (t.startsWith(PAYLOAD_PREFIX)) {
    const id = t.slice(PAYLOAD_PREFIX.length).trim();
    return UUID_RE.test(id) ? id : null;
  }
  // Allow plain UUID too
  return UUID_RE.test(t) ? t : null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab?: "show" | "scan";
}

export function FriendQRDialog({ open, onOpenChange, defaultTab = "show" }: Props) {
  const { user } = useAuth();
  const { sendRequestById, reload } = useFriends();
  const [tab, setTab] = useState<"show" | "scan">(defaultTab);
  const [busy, setBusy] = useState(false);
  const lastScanRef = useRef<string>("");

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      lastScanRef.current = "";
    }
  }, [open, defaultTab]);

  const payload = user ? `${PAYLOAD_PREFIX}${user.id}` : "";

  const copyCode = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success("Code kopiert 📋");
    } catch {
      toast.error("Konnte nicht kopieren");
    }
  };

  const handleDetected = async (id: string) => {
    if (busy) return;
    if (id === user?.id) {
      toast.error("Das ist dein eigener Code 😅");
      return;
    }
    setBusy(true);
    const res = await sendRequestById(id);
    setBusy(false);
    if (res.ok) {
      toast.success("Freundschaftsanfrage gesendet 🚀");
      reload();
      onOpenChange(false);
    } else {
      toast.error(res.error || "Fehler");
      // allow re-scan
      setTimeout(() => {
        lastScanRef.current = "";
      }, 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Freunde per QR adden
          </DialogTitle>
          <DialogDescription>
            Lass dich scannen oder scanne den Code deines Freundes – instant verbunden 💫
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="show">
              <QrCode className="h-4 w-4 mr-2" /> Mein Code
            </TabsTrigger>
            <TabsTrigger value="scan">
              <Camera className="h-4 w-4 mr-2" /> Scannen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="show" className="mt-4">
            {user ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={payload}
                    size={220}
                    level="M"
                    marginSize={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Halt diesen Code deinem Freund unter die Kamera – er addet dich automatisch.
                </p>
                <Button variant="outline" size="sm" onClick={copyCode}>
                  <Copy className="h-4 w-4 mr-2" /> Code kopieren
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bitte einloggen.</p>
            )}
          </TabsContent>

          <TabsContent value="scan" className="mt-4">
            <div className="rounded-2xl overflow-hidden bg-black aspect-square relative">
              {open && tab === "scan" && (
                <Scanner
                  onScan={(detected) => {
                    const text = detected?.[0]?.rawValue;
                    if (!text || text === lastScanRef.current) return;
                    lastScanRef.current = text;
                    const id = parseFriendPayload(text);
                    if (!id) {
                      toast.error("Kein gültiger Freund-Code");
                      setTimeout(() => (lastScanRef.current = ""), 1500);
                      return;
                    }
                    handleDetected(id);
                  }}
                  onError={(err) => {
                    console.error("QR scan error:", err);
                  }}
                  constraints={{ facingMode: "environment" }}
                  styles={{
                    container: { width: "100%", height: "100%" },
                    video: { width: "100%", height: "100%", objectFit: "cover" },
                  }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Erlaube den Kamerazugriff, um den QR-Code deines Freundes zu scannen.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
