import { X, Users, Euro, Armchair, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Lounge {
  id: string;
  name: string;
  description: string | null;
  price: number;
  min_persons: number;
  max_persons: number;
  status: "available" | "reserved" | "booked";
  images?: string[] | null;
  image_url?: string | null;
}

interface Props {
  lounge: Lounge;
  onClose: () => void;
  onBook: () => void;
}

const LoungeDetailPopup = ({ lounge, onClose, onBook }: Props) => {
  const allImages = lounge.images?.length ? lounge.images : lounge.image_url ? [lounge.image_url] : [];
  const [imgIdx, setImgIdx] = useState(0);

  const prevImg = () => setImgIdx(i => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setImgIdx(i => (i + 1) % allImages.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.75)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "hsl(220 40% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image carousel */}
        {allImages.length > 0 && (
          <div className="relative w-full aspect-video bg-black/30">
            <img
              src={allImages[imgIdx]}
              alt={lounge.name}
              className="w-full h-full object-cover"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
                  style={{ background: "hsl(0 0% 0% / 0.5)" }}
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
                  style={{ background: "hsl(0 0% 0% / 0.5)" }}
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background: i === imgIdx ? "white" : "hsl(0 0% 100% / 0.4)",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wide" style={{ color: "hsl(0 0% 100%)" }}>
                {lounge.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg shrink-0"
              style={{ background: "hsl(0 0% 100% / 0.06)" }}
            >
              <X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.5)" }} />
            </button>
          </div>

          {lounge.description && (
            <p className="text-sm mb-4" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              {lounge.description}
            </p>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "hsl(270 50% 25% / 0.3)", border: "1px solid hsl(270 50% 45% / 0.3)", color: "hsl(270 60% 70%)" }}
            >
              <Euro className="w-3.5 h-3.5" />
              {lounge.price > 0 ? `ab ${lounge.price} €` : "Kostenlos"}
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "hsl(200 50% 25% / 0.3)", border: "1px solid hsl(200 50% 45% / 0.3)", color: "hsl(200 60% 70%)" }}
            >
              <Users className="w-3.5 h-3.5" />
              {lounge.min_persons}–{lounge.max_persons} Personen
            </div>
          </div>

          {/* Book button */}
          {lounge.status === "available" ? (
            <button
              onClick={onBook}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
              style={{ background: "hsl(270 70% 55%)", color: "white" }}
            >
              <Armchair className="w-4 h-4" />
              Jetzt anfragen
            </button>
          ) : (
            <div
              className="w-full py-3 rounded-xl text-sm font-bold text-center"
              style={{
                background: lounge.status === "reserved" ? "hsl(45 80% 20% / 0.3)" : "hsl(0 60% 20% / 0.3)",
                color: lounge.status === "reserved" ? "hsl(45 80% 60%)" : "hsl(0 60% 55%)",
                border: `1px solid ${lounge.status === "reserved" ? "hsl(45 80% 50% / 0.4)" : "hsl(0 60% 45% / 0.4)"}`,
              }}
            >
              {lounge.status === "reserved" ? "Reserviert" : "Gebucht"}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoungeDetailPopup;
