import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import ProjectPaderborn from "./pages/ProjectPaderborn";
import NotFound from "./pages/NotFound";

const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const AGB = lazy(() => import("./pages/AGB"));
const Kontakt = lazy(() => import("./pages/Kontakt"));
const UeberUns = lazy(() => import("./pages/UeberUns"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Promoter = lazy(() => import("./pages/Promoter"));
const Fotos = lazy(() => import("./pages/Fotos"));
const MeineTickets = lazy(() => import("./pages/MeineTickets"));
const Muttizettel = lazy(() => import("./pages/Muttizettel"));
const VergangeneEvents = lazy(() => import("./pages/VergangeneEvents"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen" style={{ background: "hsl(0 5% 5%)" }} />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/project-paderborn" element={<ProjectPaderborn />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/agb" element={<AGB />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/ueber-uns" element={<UeberUns />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/promoter" element={<Promoter />} />
            <Route path="/fotos" element={<Fotos />} />
            <Route path="/meine-tickets" element={<MeineTickets />} />
            <Route path="/muttizettel" element={<Muttizettel />} />
            <Route path="/vergangene-events" element={<VergangeneEvents />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
