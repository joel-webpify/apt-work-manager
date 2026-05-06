import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "./components/layout/AppLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/email" element={<Email />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
