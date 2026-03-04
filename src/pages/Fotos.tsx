import { PageLayout } from "@/components/PageLayout";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

import crowdAerial from "@/assets/crowd-aerial.jpg";
import crowdGlowsticks from "@/assets/crowd-glowsticks.jpg";
import crowdGlowsticks2 from "@/assets/crowd-glowsticks2.jpg";
import crowdHands from "@/assets/crowd-hands.jpg";
import crowdWide from "@/assets/crowd-wide.jpg";
import dancerHappy from "@/assets/dancer-happy.jpg";
import crowdParty from "@/assets/crowd-party.jpg";
import crowdVertical from "@/assets/crowd-vertical.jpg";

const photos = [
  { src: crowdAerial, alt: "Party Crowd von oben" },
  { src: crowdGlowsticks, alt: "Crowd mit Leuchtstäben" },
  { src: crowdWide, alt: "Volle Venue Panorama" },
  { src: crowdHands, alt: "Crowd mit Händen in der Luft" },
  { src: dancerHappy, alt: "Happy Dancer" },
  { src: crowdParty, alt: "Party Atmosphäre" },
  { src: crowdGlowsticks2, alt: "Leuchtstäbe Meer" },
  { src: crowdVertical, alt: "Party Crowd" },
];

const videos = [
  { id: "53dTybHhlaw", title: "Video 1" },
  { id: "LrTjwGo_6Z4", title: "Video 2" },
  { id: "s8-6TQHgslw", title: "Video 3" },
  { id: "zNJMzCW0qVk", title: "Video 4" },
  { id: "1GTESLgRtvk", title: "Video 5" },
];

const Fotos = () => {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  return (
    <PageLayout title="Fotos & Videos" subtitle="Wir posten alles auf Social Media – oft auch Location-Fotografen/Videografen.">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 cursor-pointer p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Lightbox"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
          />
        </div>
      )}

      {/* Fotos */}
      <h2
        className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-6"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
      >
        Fotos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
        {photos.map((photo, i) => (
          <motion.div
            key={i}
            className="overflow-hidden rounded-xl cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightbox(photo.src)}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="w-full aspect-[4/3] object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>

      {/* Videos */}
      <h2
        className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-6"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
      >
        Videos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((video) => (
          <div key={video.id} className="overflow-hidden rounded-xl aspect-video relative">
            {playingVideo === video.id ? (
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                title={video.title}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div
                className="relative w-full h-full cursor-pointer group"
                onClick={() => setPlayingVideo(video.id)}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
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
            )}
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Fotos;
