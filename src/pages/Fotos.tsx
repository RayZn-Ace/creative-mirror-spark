import { PageLayout } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Grid2X2, Grid3X3, LayoutGrid, Columns2, Image, SlidersHorizontal, Pause, ChevronLeft, ChevronRight, Shuffle, Maximize2, X, Rows3, Video } from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fallback static images
import crowdAerial from "@/assets/crowd-aerial.jpg";
import crowdGlowsticks from "@/assets/crowd-glowsticks.jpg";
import crowdGlowsticks2 from "@/assets/crowd-glowsticks2.jpg";
import crowdHands from "@/assets/crowd-hands.jpg";
import crowdWide from "@/assets/crowd-wide.jpg";
import dancerHappy from "@/assets/dancer-happy.jpg";
import crowdParty from "@/assets/crowd-party.jpg";
import crowdVertical from "@/assets/crowd-vertical.jpg";

const fallbackPhotos = [
  { src: crowdAerial, alt: "Party Crowd von oben" },
  { src: crowdGlowsticks, alt: "Crowd mit Leuchtstäben" },
  { src: crowdWide, alt: "Volle Venue Panorama" },
  { src: crowdHands, alt: "Crowd mit Händen in der Luft" },
  { src: dancerHappy, alt: "Happy Dancer" },
  { src: crowdParty, alt: "Party Atmosphäre" },
  { src: crowdGlowsticks2, alt: "Leuchtstäbe Meer" },
  { src: crowdVertical, alt: "Party Crowd" },
];

const fallbackVideos = [
  { id: "53dTybHhlaw", title: "Video 1" },
  { id: "LrTjwGo_6Z4", title: "Video 2" },
  { id: "s8-6TQHgslw", title: "Video 3" },
  { id: "zNJMzCW0qVk", title: "Video 4" },
  { id: "1GTESLgRtvk", title: "Video 5" },
];

type ViewMode = "grid" | "slideshow" | "masonry";

const gridOptions = [
  { cols: 1, icon: Rows3, label: "1 Spalte" },
  { cols: 2, icon: Columns2, label: "2 Spalten" },
  { cols: 3, icon: Grid3X3, label: "3 Spalten" },
  { cols: 4, icon: LayoutGrid, label: "4 Spalten" },
];

const getYoutubeId = (url: string) => {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

// Generate a resized thumbnail URL via Supabase Storage transform
const getThumbUrl = (url: string, width = 400) => {
  if (!url || !url.includes('/storage/v1/object/public/')) return url;
  // Use Supabase image transformation: /render/image/public/...
  return url.replace('/storage/v1/object/public/', `/storage/v1/render/image/public/`) + `?width=${width}&resize=contain&quality=60`;
};

const Fotos = () => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [gridCols, setGridCols] = useState(3);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(3000);
  const [shuffled, setShuffled] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch albums
  const { data: albums = [] } = useQuery({
    queryKey: ["public-media-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_albums")
        .select("*")
        .eq("status", "published")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch all media (for "Alle") or media for selected album
  const { data: albumMedia = [] } = useQuery({
    queryKey: ["public-media-photos", selectedAlbumId],
    queryFn: async () => {
      // Get album IDs to filter by
      const publishedAlbumIds = albums.map((a: any) => a.id);
      if (publishedAlbumIds.length === 0) return [];

      let query = supabase
        .from("media_photos")
        .select("*")
        .order("sort_order", { ascending: true });

      if (selectedAlbumId) {
        query = query.eq("album_id", selectedAlbumId);
      } else {
        query = query.in("album_id", publishedAlbumIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: albums.length > 0,
  });

  // Separate photos and videos from album
  const dbPhotos = useMemo(() =>
    albumMedia
      .filter((m: any) => (m.media_type || "photo") === "photo")
      .map((m: any) => ({ src: m.image_url, alt: m.caption || "Foto" })),
    [albumMedia]
  );

  const dbVideos = useMemo(() =>
    albumMedia
      .filter((m: any) => m.media_type === "video" && m.video_url)
      .map((m: any) => {
        const ytId = getYoutubeId(m.video_url || "");
        return { id: ytId || m.video_url, title: m.caption || "Video", isYoutube: !!ytId, url: m.video_url };
      }),
    [albumMedia]
  );

  // Use DB data if we have albums, else fallback
  const hasDbData = albums.length > 0;
  const photos = hasDbData && dbPhotos.length > 0 ? dbPhotos : (!hasDbData ? fallbackPhotos : []);
  const videos = hasDbData ? dbVideos : fallbackVideos.map((v) => ({ ...v, isYoutube: true, url: `https://youtube.com/watch?v=${v.id}` }));

  const [displayPhotos, setDisplayPhotos] = useState(photos);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setDisplayPhotos(photos);
    setShuffled(false);
    setSlideshowIndex(0);
    setVisibleCount(20);
  }, [selectedAlbumId, albumMedia]);

  // Shuffle
  const shufflePhotos = useCallback(() => {
    const arr = [...photos];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setDisplayPhotos(arr);
    setShuffled(true);
  }, [photos]);

  const resetOrder = useCallback(() => {
    setDisplayPhotos(photos);
    setShuffled(false);
  }, [photos]);

  // Slideshow auto-advance
  useEffect(() => {
    if (viewMode === "slideshow" && isPlaying && displayPhotos.length > 0) {
      timerRef.current = setInterval(() => {
        setSlideshowIndex((prev) => (prev + 1) % displayPhotos.length);
      }, speed);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [viewMode, isPlaying, speed, displayPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        if (e.key === "Escape") setLightbox(null);
        if (e.key === "ArrowRight") setLightbox((prev) => prev !== null ? (prev + 1) % displayPhotos.length : null);
        if (e.key === "ArrowLeft") setLightbox((prev) => prev !== null ? (prev - 1 + displayPhotos.length) % displayPhotos.length : null);
        return;
      }
      if (viewMode === "slideshow") {
        if (e.key === "ArrowRight") setSlideshowIndex((prev) => (prev + 1) % displayPhotos.length);
        if (e.key === "ArrowLeft") setSlideshowIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
        if (e.key === " ") { e.preventDefault(); setIsPlaying((p) => !p); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, viewMode, displayPhotos.length]);

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }[gridCols];

  return (
    <PageLayout title="Partymomente" subtitle="Wir posten alles auf Social Media – oft auch Location-Fotografen/Videografen.">
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + displayPhotos.length) % displayPhotos.length); }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              src={displayPhotos[lightbox].src}
              alt={displayPhotos[lightbox].alt}
              className="max-w-full max-h-[90vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % displayPhotos.length); }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
              {lightbox + 1} / {displayPhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album selector */}
      {albums.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-lg sm:text-xl font-black uppercase tracking-wider mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(220 20% 15%)" }}
          >
            Alben
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            <button
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedAlbumId ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              onClick={() => setSelectedAlbumId(null)}
            >
              Alle
            </button>
            {albums.map((album: any) => (
              <button
                key={album.id}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedAlbumId === album.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                onClick={() => setSelectedAlbumId(album.id)}
              >
                {album.cover_image_url && (
                  <img src={album.cover_image_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                )}
                {album.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fotos Header + Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2
          className="text-xl sm:text-2xl font-black uppercase tracking-wider"
          style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(220 20% 15%)" }}
        >
          Fotos
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-2 rounded-md transition-all ${viewMode === "masonry" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("masonry")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Masonry</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-2 rounded-md transition-all ${viewMode === "slideshow" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => { setViewMode("slideshow"); setSlideshowIndex(0); setIsPlaying(true); }}
                  >
                    <Image className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Diashow</TooltipContent>
              </Tooltip>
            </div>

            {(viewMode === "grid" || viewMode === "masonry") && (
              <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
                {gridOptions.map((opt) => (
                  <Tooltip key={opt.cols}>
                    <TooltipTrigger asChild>
                      <button
                        className={`p-2 rounded-md transition-all ${gridCols === opt.cols ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setGridCols(opt.cols)}
                      >
                        <opt.icon className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{opt.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`p-2 rounded-md transition-all ${shuffled ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  onClick={shuffled ? resetOrder : shufflePhotos}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{shuffled ? "Zurücksetzen" : "Zufällig mischen"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && displayPhotos.length > 0 && (
        <>
          <div className={`grid ${gridColsClass} gap-3`}>
            {displayPhotos.slice(0, visibleCount).map((photo, i) => (
              <motion.div
                key={`${photo.src}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(i, 20) * 0.05 }}
                className="overflow-hidden rounded-xl cursor-pointer group relative"
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightbox(i)}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm font-medium">{photo.alt}</span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </motion.div>
            ))}
          </div>
          {visibleCount < displayPhotos.length && (
            <div className="flex justify-center mt-6 mb-16">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((prev) => prev + 20)}
                className="gap-2"
              >
                Mehr anzeigen ({displayPhotos.length - visibleCount} weitere)
              </Button>
            </div>
          )}
          {visibleCount >= displayPhotos.length && <div className="mb-16" />}
        </>
      )}

      {/* Masonry View */}
      {viewMode === "masonry" && displayPhotos.length > 0 && (
        <>
          <div className={`columns-1 ${gridCols >= 2 ? "sm:columns-2" : ""} ${gridCols >= 3 ? "lg:columns-3" : ""} ${gridCols >= 4 ? "xl:columns-4" : ""} gap-3`}>
            {displayPhotos.slice(0, visibleCount).map((photo, i) => (
              <motion.div
                key={`${photo.src}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 20) * 0.06 }}
                className="break-inside-avoid mb-3 overflow-hidden rounded-xl cursor-pointer group relative"
                onClick={() => setLightbox(i)}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}`}
                  loading="lazy"
                />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-white text-sm font-medium">{photo.alt}</span>
              </div>
              </motion.div>
            ))}
          </div>
          {visibleCount < displayPhotos.length && (
            <div className="flex justify-center mt-6 mb-16">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((prev) => prev + 20)}
                className="gap-2"
              >
                Mehr anzeigen ({displayPhotos.length - visibleCount} weitere)
              </Button>
            </div>
          )}
          {visibleCount >= displayPhotos.length && <div className="mb-16" />}
        </>
      )}

      {/* Slideshow View */}
      {viewMode === "slideshow" && displayPhotos.length > 0 && (
        <div className="mb-16">
          <div
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black mb-4 group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={slideshowIndex}
                src={displayPhotos[slideshowIndex].src}
                alt={displayPhotos[slideshowIndex].alt}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showControls ? 1 : 0 }}
              className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
            >
              <button
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
                onClick={() => setSlideshowIndex((slideshowIndex - 1 + displayPhotos.length) % displayPhotos.length)}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
                onClick={() => setSlideshowIndex((slideshowIndex + 1) % displayPhotos.length)}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 10 }}
              className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3"
            >
              <div className="flex items-end justify-between">
                <p className="text-white font-bold text-lg drop-shadow-lg">
                  {displayPhotos[slideshowIndex].alt}
                </p>
                <Badge variant="secondary" className="bg-black/40 backdrop-blur text-white border-none">
                  {slideshowIndex + 1} / {displayPhotos.length}
                </Badge>
              </div>
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: isPlaying ? speed / 1000 : 0,
                    ease: "linear",
                    repeat: 0,
                  }}
                  key={`${slideshowIndex}-${isPlaying}`}
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: showControls ? 1 : 0 }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
              onClick={() => setLightbox(slideshowIndex)}
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSlideshowIndex((slideshowIndex - 1 + displayPhotos.length) % displayPhotos.length)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSlideshowIndex((slideshowIndex + 1) % displayPhotos.length)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{(speed / 1000).toFixed(1)}s</span>
              <Slider
                value={[speed]}
                onValueChange={(v) => setSpeed(v[0])}
                min={1000}
                max={8000}
                step={500}
                className="flex-1 min-w-[100px]"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
            {displayPhotos.map((photo, i) => (
              <button
                key={i}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === slideshowIndex ? "border-primary shadow-lg shadow-primary/30 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                onClick={() => { setSlideshowIndex(i); setIsPlaying(false); }}
              >
                <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No photos message */}
      {displayPhotos.length === 0 && selectedAlbumId && (
        <div className="text-center py-16 text-muted-foreground mb-16">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Keine Fotos in diesem Album</p>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <>
          <h2
            className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-6"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(220 20% 15%)" }}
          >
            Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {videos.map((video: any) => {
              const ytId = video.isYoutube ? (video.id || getYoutubeId(video.url)) : null;
              return (
                <div key={video.id || video.url} className="overflow-hidden rounded-xl aspect-video relative">
                  {ytId && playingVideo === ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      title={video.title}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : ytId ? (
                    <div
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => setPlayingVideo(ytId)}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-all">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ background: "hsl(330 80% 55%)" }}
                        >
                          <Play className="w-6 h-6 ml-0.5" style={{ color: "hsl(0 0% 100%)" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center bg-muted">
                      <Video className="w-10 h-10 text-muted-foreground" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default Fotos;
