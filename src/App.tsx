import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import TrackingProvider from "@/components/TrackingProvider";
import Index from "./pages/Index";
const CityPage = lazy(() => import("./pages/CityPage"));
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
const Abiklasse = lazy(() => import("./pages/Abiklasse"));
const Jobs = lazy(() => import("./pages/Jobs"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Scanner = lazy(() => import("./pages/Scanner"));

// Admin
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const SeriesAdmin = lazy(() => import("./pages/admin/SeriesAdmin"));
const EventsAdmin = lazy(() => import("./pages/admin/EventsAdmin"));
const TicketsAdmin = lazy(() => import("./pages/admin/TicketsAdmin"));
const PagesAdmin = lazy(() => import("./pages/admin/PagesAdmin"));
const TrackingAdminPage = lazy(() => import("./pages/admin/TrackingAdmin"));
const CustomersAdmin = lazy(() => import("./pages/admin/CustomersAdmin"));
const NewsletterAdmin = lazy(() => import("./pages/admin/NewsletterAdmin"));
const ScannerAdmin = lazy(() => import("./pages/admin/ScannerAdmin"));
const SettingsAdmin = lazy(() => import("./pages/admin/SettingsAdmin"));
const TemplatesAdmin = lazy(() => import("./pages/admin/TemplatesAdmin"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen" style={{ background: "hsl(0 5% 5%)" }} />}>
            <TrackingProvider />
            <Routes>
              <Route path="/" element={<Index />} />
              
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
              <Route path="/abiklasse" element={<Abiklasse />} />
              <Route path="/jobs" element={<Jobs />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="series" element={<SeriesAdmin />} />
                <Route path="events" element={<EventsAdmin />} />
                <Route path="tickets" element={<TicketsAdmin />} />
                <Route path="pages" element={<PagesAdmin />} />
                <Route path="customers" element={<CustomersAdmin />} />
                <Route path="newsletter" element={<NewsletterAdmin />} />
                <Route path="tracking" element={<TrackingAdminPage />} />
                <Route path="scanner" element={<ScannerAdmin />} />
                <Route path="settings" element={<SettingsAdmin />} />
                <Route path="vorlagen" element={<TemplatesAdmin />} />
              </Route>

              <Route path="/bestellung/:orderId" element={<OrderConfirmation />} />
              <Route path="/scan" element={<Scanner />} />
              <Route path="/:citySlug" element={<CityPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
