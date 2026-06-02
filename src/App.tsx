import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import TrackingProvider from "@/components/TrackingProvider";
import VisitorTracker from "@/components/VisitorTracker";
import SocialProofToast from "@/components/SocialProofToast";
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
const Termine = lazy(() => import("./pages/Termine"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Scanner = lazy(() => import("./pages/Scanner"));
const TicketUmbuchung = lazy(() => import("./pages/TicketUmbuchung"));
const FuerWen = lazy(() => import("./pages/FuerWen"));
const LocationAnmelden = lazy(() => import("./pages/LocationAnmelden"));
const PartnerWerden = lazy(() => import("./pages/PartnerWerden"));
const InfluencerPage = lazy(() => import("./pages/Influencer"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));

// Admin
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/admin/AdminRegister"));
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
const AnalyticsAdmin = lazy(() => import("./pages/admin/AnalyticsAdmin"));
const CouponsAdmin = lazy(() => import("./pages/admin/CouponsAdmin"));
const WerbemanagerAdmin = lazy(() => import("./pages/admin/WerbemanagerAdmin"));
const SupportAdmin = lazy(() => import("./pages/admin/SupportAdmin"));
const MuttizettelAdmin = lazy(() => import("./pages/admin/MuttizettelAdmin"));
const MediaAdmin = lazy(() => import("./pages/admin/MediaAdmin"));
const CsvImportAdmin = lazy(() => import("./pages/admin/CsvImportAdmin"));
const WaitlistAdmin = lazy(() => import("./pages/admin/WaitlistAdmin"));
const ApplicantsAdmin = lazy(() => import("./pages/admin/ApplicantsAdmin"));
const FreeTicketsAdmin = lazy(() => import("./pages/admin/FreeTicketsAdmin"));
const LoungesAdmin = lazy(() => import("./pages/admin/LoungesAdmin"));
const PushAdmin = lazy(() => import("./pages/admin/PushAdmin"));
const GoodiesAdmin = lazy(() => import("./pages/admin/GoodiesAdmin"));
const WrappedAdmin = lazy(() => import("./pages/admin/WrappedAdmin"));

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const AccountDashboard = lazy(() => import("./pages/account/Dashboard"));
const AccountProfile = lazy(() => import("./pages/account/Profile"));
const AccountTickets = lazy(() => import("./pages/account/MyTickets"));
const AccountOrders = lazy(() => import("./pages/account/Orders"));
const AccountFavorites = lazy(() => import("./pages/account/Favorites"));
const AccountNotifications = lazy(() => import("./pages/account/Notifications"));
const AccountRewards = lazy(() => import("./pages/account/Rewards"));
const AccountFriends = lazy(() => import("./pages/account/Friends"));
const AccountWrapped = lazy(() => import("./pages/account/Wrapped"));
const AccountMusicCallback = lazy(() => import("./pages/account/MusicCallback"));
const AccountMemories = lazy(() => import("./pages/account/Memories"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <TrackingProvider />
            <VisitorTracker />
            <SocialProofToast />
            <Routes>
              <Route path="/" element={<Index />} />
              
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="/agb" element={<AGB />} />
              <Route path="/kontakt" element={<Kontakt />} />
              <Route path="/ticket-umbuchung" element={<TicketUmbuchung />} />
              <Route path="/ueber-uns" element={<UeberUns />} />
              <Route path="/fuer-wen" element={<FuerWen />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/promoter" element={<Promoter />} />
              <Route path="/location-anmelden" element={<LocationAnmelden />} />
              <Route path="/partner" element={<PartnerWerden />} />
              <Route path="/influencer" element={<InfluencerPage />} />
              <Route path="/media" element={<Fotos />} />
              <Route path="/fotos" element={<Fotos />} />
              <Route path="/meine-tickets" element={<MeineTickets />} />
              <Route path="/muttizettel" element={<Muttizettel />} />
              <Route path="/vergangene-events" element={<VergangeneEvents />} />
              <Route path="/abiklasse" element={<Abiklasse />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/termine" element={<Termine />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="analytics" element={<AnalyticsAdmin />} />
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
                <Route path="coupons" element={<CouponsAdmin />} />
                <Route path="werbemanager" element={<WerbemanagerAdmin />} />
                <Route path="support" element={<SupportAdmin />} />
                <Route path="muttizettel" element={<MuttizettelAdmin />} />
                <Route path="medien" element={<MediaAdmin />} />
                <Route path="csv-import" element={<CsvImportAdmin />} />
                <Route path="waitlist" element={<WaitlistAdmin />} />
                <Route path="bewerber" element={<ApplicantsAdmin />} />
                <Route path="freitickets" element={<FreeTicketsAdmin />} />
                <Route path="lounges" element={<LoungesAdmin />} />
                <Route path="push" element={<PushAdmin />} />
                <Route path="goodies" element={<GoodiesAdmin />} />
                <Route path="wrapped" element={<WrappedAdmin />} />
              </Route>

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<AccountDashboard />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="tickets" element={<AccountTickets />} />
                <Route path="orders" element={<AccountOrders />} />
                <Route path="favorites" element={<AccountFavorites />} />
                <Route path="notifications" element={<AccountNotifications />} />
                <Route path="rewards" element={<AccountRewards />} />
                <Route path="friends" element={<AccountFriends />} />
                <Route path="wrapped" element={<AccountWrapped />} />
                <Route path="music/callback" element={<AccountMusicCallback />} />
                <Route path="memories" element={<AccountMemories />} />
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
