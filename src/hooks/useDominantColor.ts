import { useEffect, useState } from "react";

export interface DominantColor {
  hue: number;
  sat: number;
  light: number;
  // Secondary accent from image for richer gradients
  hue2: number;
  sat2: number;
  light2: number;
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

/**
 * Samples the edges/corners of an image to detect the "background" color,
 * plus extracts the overall dominant color for a secondary accent.
 */
export const useDominantColor = (imageUrl: string | null): DominantColor | null => {
  const [color, setColor] = useState<DominantColor | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // --- Sample EDGES for background color ---
        const edgePixels: [number, number, number][] = [];
        const edgeWidth = 6; // pixels from edge to sample
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isEdge = x < edgeWidth || x >= size - edgeWidth || y < edgeWidth || y >= size - edgeWidth;
            if (!isEdge) continue;
            const i = (y * size + x) * 4;
            edgePixels.push([data[i], data[i + 1], data[i + 2]]);
          }
        }

        // --- Sample ALL pixels for dominant accent ---
        const allBuckets: Record<number, { count: number; totalSat: number; totalLight: number; totalHue: number }> = {};
        const edgeBuckets: Record<number, { count: number; totalSat: number; totalLight: number; totalHue: number }> = {};

        const addToBucket = (buckets: typeof allBuckets, r: number, g: number, b: number) => {
          const [h, s, l] = rgbToHsl(r, g, b);
          if (l < 5 || l > 95 || s < 8) return; // skip extreme pixels
          const bucket = Math.round(h / 15) * 15;
          if (!buckets[bucket]) buckets[bucket] = { count: 0, totalSat: 0, totalLight: 0, totalHue: 0 };
          buckets[bucket].count++;
          buckets[bucket].totalSat += s;
          buckets[bucket].totalLight += l;
          buckets[bucket].totalHue += h;
        };

        // Process edge pixels
        for (const [r, g, b] of edgePixels) {
          addToBucket(edgeBuckets, r, g, b);
        }

        // Process all pixels
        for (let i = 0; i < data.length; i += 4) {
          addToBucket(allBuckets, data[i], data[i + 1], data[i + 2]);
        }

        const findBest = (buckets: typeof allBuckets) => {
          let bestBucket = -1;
          let bestCount = 0;
          for (const [bucket, info] of Object.entries(buckets)) {
            if (info.count > bestCount) {
              bestCount = info.count;
              bestBucket = parseInt(bucket);
            }
          }
          if (bestBucket >= 0 && buckets[bestBucket]) {
            const b = buckets[bestBucket];
            return {
              hue: Math.round(b.totalHue / b.count),
              sat: Math.round(b.totalSat / b.count),
              light: Math.round(b.totalLight / b.count),
            };
          }
          return null;
        };

        const edgeColor = findBest(edgeBuckets);
        const allColor = findBest(allBuckets);

        // Use edge color as primary (background), all color as secondary accent
        const primary = edgeColor || allColor || { hue: 210, sat: 55, light: 52 };
        const secondary = allColor || edgeColor || { hue: 210, sat: 55, light: 52 };

        setColor({
          hue: primary.hue,
          sat: Math.max(25, Math.min(70, primary.sat)),
          light: Math.max(20, Math.min(50, primary.light)),
          hue2: secondary.hue,
          sat2: Math.max(30, Math.min(75, secondary.sat)),
          light2: Math.max(25, Math.min(55, secondary.light)),
        });
      } catch {
        setColor({ hue: 210, sat: 55, light: 52, hue2: 230, sat2: 50, light2: 45 });
      }
    };

    img.onerror = () => {
      setColor({ hue: 210, sat: 55, light: 52, hue2: 230, sat2: 50, light2: 45 });
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return color;
};
