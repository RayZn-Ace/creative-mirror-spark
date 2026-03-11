import { useState } from "react";
import { motion } from "framer-motion";

interface TicketItem {
  id: string;
  name: string;
  description: string;
  price: string;
  soldOut: boolean;
}

interface TicketCategory {
  title: string;
  items: TicketItem[];
}

const ticketData: TicketCategory[] = [
  {
    title: "REGULAR",
    items: [
      { id: "super-early", name: "SUPER EARLY BIRD TICKET", description: "Eintrittspreis", price: "19,90", soldOut: true },
      { id: "early-bird", name: "EARLY BIRD TICKET", description: "Eintrittspreis", price: "24,90", soldOut: false },
    ],
  },
  {
    title: "FAST LANE",
    items: [
      { id: "super-early-fast", name: "SUPER EARLY BIRD FAST LANE", description: "Eintrittspreis inkl. bevorzugtem Einlass", price: "29,90", soldOut: true },
      { id: "early-fast", name: "EARLY BIRD TICKET FAST LANE", description: "Eintrittspreis inkl. bevorzugtem Einlass", price: "34,90", soldOut: false },
    ],
  },
];

const stageTicket: TicketItem = {
  id: "stage",
  name: "STAGE TICKET",
  description: "Eintrittspreis inkl. bevorzugtem Einlass und exklusivem Zugang zum Stage-Bereich.",
  price: "79,90",
  soldOut: false,
};

const QuantitySelector = ({ id }: { id: string }) => {
  const [qty, setQty] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      <button className="quantity-btn" onClick={() => setQty(Math.max(0, qty - 1))} aria-label="Menge reduzieren">-</button>
      <input type="number" className="quantity-input" value={qty} readOnly min={0} max={99} />
      <button className="quantity-btn" onClick={() => setQty(Math.min(99, qty + 1))} aria-label="Menge erhöhen">+</button>
    </div>
  );
};

const TicketRow = ({ item }: { item: TicketItem }) => (
  <div className="ticket-item">
    {/* Desktop layout */}
    <div className="hidden sm:flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h4 className={`ticket-title ${item.soldOut ? "sold-out-line" : ""}`}>{item.name}</h4>
        <p className="ticket-description mt-0.5">{item.description}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="ticket-price">
            <span className="text-xs font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="ticket-tax">inkl. 7% MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="sold-out-badge w-[88px] text-center">SOLD OUT</div>
        ) : (
          <QuantitySelector id={item.id} />
        )}
      </div>
    </div>

    {/* Mobile layout - stacked */}
    <div className="sm:hidden space-y-2">
      <div>
        <h4 className={`ticket-title text-xs ${item.soldOut ? "sold-out-line" : ""}`}>{item.name}</h4>
        <p className="ticket-description mt-0.5 text-[10px]">{item.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="ticket-price text-xs">
            <span className="text-[10px] font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="ticket-tax">inkl. 7% MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="sold-out-badge text-[10px]">SOLD OUT</div>
        ) : (
          <QuantitySelector id={item.id} />
        )}
      </div>
    </div>
  </div>
);

const TicketWidget = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {ticketData.map((category) => (
        <div key={category.title}>
          <h3 className="ticket-category-title mb-2 sm:mb-3 text-xs sm:text-sm">{category.title}</h3>
          <div>
            {category.items.map((item) => (
              <TicketRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}

      <div>
        <h3 className="ticket-category-title mb-2 sm:mb-3 text-xs sm:text-sm">STAGE</h3>
        <div className="stage-badge text-center mb-3 sm:mb-4 p-4 sm:p-6">
          <div className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-1">VIP STAGE</div>
          <div className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-base sm:text-lg font-black uppercase tracking-wider" style={{ background: "hsl(0 0% 0% / 0.8)" }}>
            ARTIST
          </div>
        </div>
        <TicketRow item={stageTicket} />
      </div>

      <motion.button className="cart-button mt-3 sm:mt-4 text-xs sm:text-sm py-3 sm:py-3.5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        IN DEN WARENKORB
      </motion.button>
    </div>
  );
};

export default TicketWidget;
