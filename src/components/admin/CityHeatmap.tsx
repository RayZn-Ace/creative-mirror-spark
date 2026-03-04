import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

/* ─── Known city coordinates (DACH + Europe + Brazil) ─── */
const CITY_COORDS: Record<string, [number, number]> = {
  // Germany
  "Aachen": [50.7753, 6.0839], "Albstadt": [48.2126, 9.0246], "Apolda": [51.0236, 11.5155],
  "Augsburg": [48.3705, 10.8978], "Bautzen": [51.1814, 14.4344], "Berlin": [52.5200, 13.4050],
  "Bielefeld": [52.0302, 8.5325], "Bochum": [51.4818, 7.2162], "Bonn": [50.7374, 7.0982],
  "Bottrop": [51.5247, 6.9286], "Buxtehude": [53.4733, 9.6855], "Darmstadt": [49.8728, 8.6512],
  "Dortmund": [51.5136, 7.4653], "Dresden": [51.0504, 13.7373], "Düsseldorf": [51.2277, 6.7735],
  "Erfurt": [50.9847, 11.0299], "Essen": [51.4556, 7.0116], "Frankfurt": [50.1109, 8.6821],
  "Hamburg": [53.5511, 9.9937], "Hannover": [52.3759, 9.7320], "Karlsruhe": [49.0069, 8.4037],
  "Köln": [50.9375, 6.9603], "Leipzig": [51.3397, 12.3731], "München": [48.1351, 11.5820],
  "Nürnberg": [49.4521, 11.0767], "Stuttgart": [48.7758, 9.1829],
  "Paderborn": [51.7189, 8.7575], "Münster": [51.9607, 7.6261], "Detmold": [51.9386, 8.8789],
  "Gütersloh": [51.9032, 8.3858], "Herford": [52.1145, 8.6734], "Lippstadt": [51.6749, 8.3447],
  // Austria
  "Wien": [48.2082, 16.3738], "Salzburg": [47.8095, 13.0550], "Linz": [48.3064, 14.2858],
  "Innsbruck": [47.2692, 11.4041], "Dornbirn": [47.4125, 9.7438], "Gralla": [46.7500, 15.6000],
  "Kitzbühel": [47.4462, 12.3912], "Kollerschlag": [48.6000, 13.8333], "St. Martin": [48.3333, 13.6167],
  "Vöcklabruck": [48.0028, 13.6561],
  // Switzerland
  "Zürich": [47.3769, 8.5417], "Lyss": [47.0753, 7.3069], "Olten": [47.3520, 7.9068],
  "St. Gallen": [47.4245, 9.3767], "Winterthur": [47.4990, 8.7290],
  // Netherlands
  "Amsterdam": [52.3676, 4.9041], "Rotterdam": [51.9244, 4.4777], "Utrecht": [52.0907, 5.1214],
  // Belgium
  "Antwerpen": [51.2194, 4.4025],
  // France
  "Paris": [48.8566, 2.3522], "Le Havre": [49.4944, 0.1079], "Mathay": [47.4333, 6.7833],
  // Luxembourg
  "Luxemburg": [49.6117, 6.1300], "Luxembourg": [49.6117, 6.1300],
  // Poland
  "Krakow": [50.0647, 19.9450],
  // Croatia
  "Zadar": [44.1194, 15.2314],
  // Brazil
  "São Paulo": [-23.5505, -46.6333],
};

interface CityDataItem {
  name: string;
  revenue: number;
  orders: number;
  tickets: number;
}

/* Auto-fit bounds */
const FitBounds = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 8);
      return;
    }
    const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [coords, map]);
  return null;
};

/* Heat layer component */
const HeatLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    if (points.length === 0) return;

    // @ts-ignore – leaflet.heat extends L
    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 12,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: "#0d0887",
        0.15: "#4903a0",
        0.3: "#7d03a8",
        0.45: "#b5367a",
        0.6: "#e8566d",
        0.75: "#fb8861",
        0.9: "#fec287",
        1.0: "#f0f921",
      },
    });

    heat.addTo(map);
    layerRef.current = heat;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [points, map]);

  return null;
};

/* City labels on hover (lightweight markers) */
const CityLabels = ({ markers, maxRevenue }: { markers: (CityDataItem & { lat: number; lng: number })[]; maxRevenue: number }) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    if (layerGroupRef.current) {
      map.removeLayer(layerGroupRef.current);
    }

    const group = L.layerGroup();

    markers.forEach((m) => {
      const circle = L.circleMarker([m.lat, m.lng], {
        radius: 4,
        fillColor: "transparent",
        fillOpacity: 0,
        color: "transparent",
        weight: 0,
        interactive: true,
      });

      circle.bindTooltip(
        `<div style="background:hsl(220 40% 12%);color:#fff;padding:8px 12px;border-radius:10px;border:1px solid hsl(0 0% 100%/0.1);font-size:12px;min-width:140px;">
          <div style="font-weight:800;font-size:13px;margin-bottom:4px">${m.name}</div>
          <div style="color:hsl(140 60% 55%);font-weight:700">${fmt(m.revenue)} €</div>
          <div style="color:#fff;margin-top:2px">${m.orders} Bestellungen · ${m.tickets} Tickets</div>
        </div>`,
        {
          direction: "top",
          offset: [0, -8],
          className: "city-heatmap-tooltip",
          permanent: false,
        }
      );

      group.addLayer(circle);
    });

    group.addTo(map);
    layerGroupRef.current = group;

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [markers, maxRevenue, map]);

  return null;
};

export const CityHeatmap = ({ data }: { data: CityDataItem[] }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  const markers = useMemo(() =>
    data
      .map(d => {
        const coord = CITY_COORDS[d.name];
        if (!coord) return null;
        return { ...d, lat: coord[0], lng: coord[1] };
      })
      .filter(Boolean) as (CityDataItem & { lat: number; lng: number })[],
    [data]
  );

  const heatPoints = useMemo(() =>
    markers.map(m => [m.lat, m.lng, m.revenue / maxRevenue] as [number, number, number]),
    [markers, maxRevenue]
  );

  const coords = markers.map(m => [m.lat, m.lng] as [number, number]);

  if (markers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
        Keine Geodaten verfügbar
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.06)" }}>
      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={5}
        style={{ height: 480, width: "100%", background: "hsl(220 40% 8%)" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds coords={coords} />
        <HeatLayer points={heatPoints} />
        <CityLabels markers={markers} maxRevenue={maxRevenue} />
      </MapContainer>
    </div>
  );
};
