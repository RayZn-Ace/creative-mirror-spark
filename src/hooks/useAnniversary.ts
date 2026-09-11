import { useEffect, useState } from "react";
import { isAnniversaryActive } from "@/lib/anniversary";

/** True solange der Jubiläums-Modus läuft (endet automatisch am 20.09.). */
export function useAnniversary(): boolean {
  const [active, setActive] = useState(() => isAnniversaryActive());

  useEffect(() => {
    const id = setInterval(() => setActive(isAnniversaryActive()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("anniversary", active);
    return () => document.body.classList.remove("anniversary");
  }, [active]);

  return active;
}
