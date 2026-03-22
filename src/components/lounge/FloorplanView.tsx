import { motion } from "framer-motion";

interface Lounge {
  id: string;
  name: string;
  status: "available" | "reserved" | "booked";
  price: number;
  position_x: number;
  position_y: number;
  position_w: number;
  position_h: number;
}

interface Props {
  lounges: Lounge[];
  onSelect: (lounge: Lounge) => void;
  selectedId?: string;
  /** Admin mode: all lounges clickable regardless of status */
  adminMode?: boolean;
}

const statusColors: Record<string, { fill: string; stroke: string; text: string; label: string }> = {
  available: { fill: "hsl(150 60% 20% / 0.4)", stroke: "hsl(150 70% 45%)", text: "hsl(150 70% 60%)", label: "Frei" },
  reserved: { fill: "hsl(45 80% 25% / 0.4)", stroke: "hsl(45 80% 55%)", text: "hsl(45 80% 65%)", label: "Reserviert" },
  booked: { fill: "hsl(0 60% 25% / 0.4)", stroke: "hsl(0 60% 50%)", text: "hsl(0 60% 60%)", label: "Gebucht" },
};

// Positions keyed by sort_order (0-7) to survive renames
const defaultPositions: Record<number, { x: number; y: number; w: number; h: number }> = {
  0: { x: 60, y: 590, w: 100, h: 80 },   // Lounge 1
  1: { x: 60, y: 470, w: 100, h: 80 },   // Lounge 2
  2: { x: 60, y: 350, w: 100, h: 80 },   // Lounge 3
  3: { x: 30, y: 130, w: 180, h: 110 },  // Martini Lounge 4
  4: { x: 260, y: 130, w: 140, h: 80 },  // VIP Lounge 5
  5: { x: 430, y: 300, w: 110, h: 70 },  // Lounge 6
  6: { x: 430, y: 570, w: 110, h: 70 },  // Lounge 7
  7: { x: 430, y: 660, w: 110, h: 70 },  // Lounge 8
};

const FloorplanView = ({ lounges, onSelect, selectedId, adminMode = false }: Props) => {
  const vbW = 600;
  const vbH = 900;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: val.stroke }} />
            <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{val.label}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto"
        style={{ background: "hsl(220 30% 6%)", borderRadius: 12 }}
      >
        {/* Walls */}
        <rect x={30} y={120} width={540} height={720} rx={4}
          fill="none" stroke="hsl(0 0% 100% / 0.15)" strokeWidth={2} />
        <line x1={30} y1={280} x2={170} y2={280} stroke="hsl(0 0% 100% / 0.15)" strokeWidth={2} />
        <line x1={170} y1={120} x2={170} y2={330} stroke="hsl(0 0% 100% / 0.15)" strokeWidth={2} />
        <path d="M170,330 Q170,280 220,280" fill="none" stroke="hsl(0 0% 100% / 0.15)" strokeWidth={2} />
        <line x1={420} y1={120} x2={420} y2={240} stroke="hsl(0 0% 100% / 0.1)" strokeWidth={1} strokeDasharray="4 4" />
        <rect x={285} y={116} width={30} height={8} rx={4} fill="hsl(0 0% 100% / 0.08)" />

        {/* Labels */}
        <text x={300} y={510} textAnchor="middle" fill="hsl(0 0% 100% / 0.12)" fontSize={28} fontWeight={700} fontFamily="sans-serif">
          Tanzfläche
        </text>
        <rect x={430} y={460} width={100} height={55} rx={4}
          fill="hsl(270 40% 20% / 0.3)" stroke="hsl(270 40% 50% / 0.4)" strokeWidth={1} />
        <text x={480} y={492} textAnchor="middle" fill="hsl(270 40% 60% / 0.7)" fontSize={12} fontWeight={600}>DJ Pult</text>
        <rect x={180} y={760} width={280} height={45} rx={4}
          fill="hsl(210 40% 20% / 0.3)" stroke="hsl(210 40% 50% / 0.4)" strokeWidth={1} />
        <text x={320} y={787} textAnchor="middle" fill="hsl(210 40% 60% / 0.7)" fontSize={12} fontWeight={600}>Grey Goose Bar</text>
        <text x={555} y={170} textAnchor="middle" fill="hsl(0 0% 100% / 0.15)" fontSize={9} fontWeight={500}>
          <tspan x={555} dy={0}>Raucher-</tspan>
          <tspan x={555} dy={12}>bereich</tspan>
        </text>
        <text x={50} y={820} textAnchor="middle" fill="hsl(0 0% 100% / 0.2)" fontSize={10} fontWeight={500}>Eingang</text>
        <rect x={30} y={790} width={8} height={30} rx={2} fill="hsl(0 0% 100% / 0.08)" />

        {/* Lounges */}
        {lounges.map((lounge) => {
          const pos = defaultPositions[lounge.name] || {
            x: lounge.position_x, y: lounge.position_y, w: lounge.position_w, h: lounge.position_h
          };
          const colors = statusColors[lounge.status] || statusColors.available;
          const isSelected = selectedId === lounge.id;
          const isClickable = adminMode || lounge.status === "available";

          return (
            <g
              key={lounge.id}
              onClick={() => isClickable && onSelect(lounge)}
              style={{ cursor: isClickable ? "pointer" : "not-allowed" }}
            >
              <motion.rect
                x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={6}
                fill={colors.fill}
                stroke={isSelected ? "hsl(270 70% 55%)" : colors.stroke}
                strokeWidth={isSelected ? 2.5 : 1.5}
                whileHover={isClickable ? { scale: 1.03 } : {}}
                style={{ transformOrigin: `${pos.x + pos.w / 2}px ${pos.y + pos.h / 2}px` }}
              />
              <text
                x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 - 6}
                textAnchor="middle" fill={colors.text}
                fontSize={pos.w > 120 ? 13 : 11} fontWeight={700}
              >
                {lounge.name}
              </text>
              <text
                x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + 10}
                textAnchor="middle" fill="hsl(0 0% 100% / 0.4)"
                fontSize={9}
              >
                {lounge.status === "available" && !adminMode
                  ? `${lounge.price > 0 ? lounge.price + " €" : "Kostenlos"}`
                  : statusColors[lounge.status].label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default FloorplanView;
