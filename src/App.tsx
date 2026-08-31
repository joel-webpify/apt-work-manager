import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "./components/layout/AppLayout";
import { MarketingLayout } from "./components/layout/MarketingLayout";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Contacts from "./pages/Contacts";
import Forms from "./pages/Forms";
import Email from "./pages/Email";
import Ads from "./pages/Ads";
import Reporting from "./pages/Reporting";
import Tracking from "./pages/Tracking";
import Settings from "./pages/Settings";
import Quotes from "./pages/Quotes";
import NotFound from "./pages/NotFound";
import MarketingOverview from "./pages/marketing/MarketingOverview";
import GoogleBusiness from "./pages/marketing/GoogleBusiness";
import SocialOrganic from "./pages/marketing/SocialOrganic";
import SocialPaid from "./pages/marketing/SocialPaid";
import Workflows from "./pages/automations/Workflows";
import WorkflowDetail from "./pages/automations/WorkflowDetail";
import Sequences from "./pages/automations/Sequences";
import Login from "./pages/Login";
import OAuthConsent from "./pages/OAuthConsent";
import FieldLayout from "./components/field/FieldLayout";
import MyDay from "./pages/field/MyDay";
import FieldJob from "./pages/field/FieldJob";
import MyStats from "./pages/field/MyStats";
import MyWeek from "./pages/field/MyWeek";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/field" element={<FieldLayout />}>
            <Route index element={<MyDay />} />
            <Route path="job/:id" element={<FieldJob />} />
            <Route path="week" element={<MyWeek />} />
            <Route path="me" element={<MyStats />} />
          </Route>
          <Route element={<AppLayout />}>


            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/quotes" element={<Quotes />} />

            <Route path="/marketing" element={<MarketingLayout />}>
              <Route index element={<MarketingOverview />} />
              <Route path="gbp" element={<GoogleBusiness />} />
              <Route path="social-organic" element={<SocialOrganic />} />
              <Route path="social-paid" element={<SocialPaid />} />
              <Route path="email" element={<Email />} />
              <Route path="ads" element={<Ads />} />
            </Route>

            <Route path="/automations" element={<Workflows />} />
            <Route path="/automations/sequences" element={<Sequences />} />
            <Route path="/automations/:id" element={<WorkflowDetail />} />

            <Route path="/reporting" element={<Reporting />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/settings" element={<Settings />} />

            {/* Legacy redirects */}
            <Route path="/email" element={<Navigate to="/marketing/email" replace />} />
            <Route path="/ads" element={<Navigate to="/marketing/ads" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
