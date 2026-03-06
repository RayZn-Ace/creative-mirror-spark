import { useEffect, useState } from "react";

interface DominantColor {
  hue: number;
  sat: number;
  light: number;
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

export const useDominantColor = (imageUrl: string | null): DominantColor | null => {
  const [color, setColor] = useState<DominantColor | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 50; // Sample at low res for speed
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Bucket colors by hue (exclude very dark/light/desaturated pixels)
        const hueBuckets: Record<number, { count: number; totalSat: number; totalLight: number }> = {};
        
        for (let i = 0; i < data.length; i += 4) {
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          // Skip near-black, near-white, and very desaturated
          if (l < 10 || l > 90 || s < 15) continue;
          
          const bucket = Math.round(h / 10) * 10; // 10-degree buckets
          if (!hueBuckets[bucket]) hueBuckets[bucket] = { count: 0, totalSat: 0, totalLight: 0 };
          hueBuckets[bucket].count++;
          hueBuckets[bucket].totalSat += s;
          hueBuckets[bucket].totalLight += l;
        }

        // Find the most common hue bucket
        let bestBucket = -1;
        let bestCount = 0;
        for (const [bucket, info] of Object.entries(hueBuckets)) {
          if (info.count > bestCount) {
            bestCount = info.count;
            bestBucket = parseInt(bucket);
          }
        }

        if (bestBucket >= 0 && hueBuckets[bestBucket]) {
          const b = hueBuckets[bestBucket];
          const avgSat = Math.round(b.totalSat / b.count);
          const avgLight = Math.round(b.totalLight / b.count);
          
          // Clamp saturation and lightness for a pleasant gradient background
          setColor({
            hue: bestBucket,
            sat: Math.max(35, Math.min(70, avgSat)),
            light: Math.max(30, Math.min(55, avgLight)),
          });
        } else {
          // Fallback: default blue
          setColor({ hue: 210, sat: 55, light: 52 });
        }
      } catch {
        // Canvas tainted or other error – use default
        setColor({ hue: 210, sat: 55, light: 52 });
      }
    };

    img.onerror = () => {
      setColor({ hue: 210, sat: 55, light: 52 });
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return color;
};
