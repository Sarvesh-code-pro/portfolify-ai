import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreatePortfolio from "./pages/CreatePortfolio";
import CreateFromResume from "./pages/CreateFromResume";
import CreateFromLinkedIn from "./pages/CreateFromLinkedIn";
import PortfolioDetails from "./pages/PortfolioDetails";
import Editor from "./pages/Editor";
import PublicPortfolio from "./pages/PublicPortfolio";
import PublicLinkPortfolio from "./pages/PublicLinkPortfolio";
import Onboarding from "./pages/Onboarding";
import Contact from "./pages/Contact";
import Workspaces from "./pages/Workspaces";
import AdminDashboard from "./pages/AdminDashboard";
import Resumes from "./pages/Resumes";
import ResumeEditor from "./pages/ResumeEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreatePortfolio />} />
              <Route path="/create/resume" element={<CreateFromResume />} />
              <Route path="/create/linkedin" element={<CreateFromLinkedIn />} />
              <Route path="/create/details" element={<PortfolioDetails />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/p/:username" element={<PublicPortfolio />} />
              <Route path="/link/:slug" element={<PublicLinkPortfolio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/workspaces" element={<Workspaces />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/resumes" element={<Resumes />} />
              <Route path="/resumes/:id" element={<ResumeEditor />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
