import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Login } from "@/pages/Login";
import LoginSuccess from "@/pages/LoginSuccess";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Module Pages
import Samvaad from "./pages/Samvaad";
import LipiGyan from "./pages/LipiGyan";
import Saaransh from "./pages/Saaransh";
import Panchang from "./pages/Panchang";

// Samvaad Sub-features
import Consultation from "./pages/samvaad/Consultation";
import Triage from "./pages/samvaad/Triage";

// Lipi-Gyan Sub-features
import Prescription from "./pages/lipi-gyan/Prescription";
import LabReport from "./pages/lipi-gyan/LabReport";
import Discharge from "./pages/lipi-gyan/Discharge";

// Saaransh Sub-features
import ClinicalNotes from "./pages/saaransh/ClinicalNotes";
import ActionPlan from "./pages/saaransh/ActionPlan";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/login/success" element={<LoginSuccess />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                
                {/* Main Module Routes */}
                <Route path="/samvaad" element={<Samvaad />} />
                <Route path="/lipi-gyan" element={<LipiGyan />} />
                <Route path="/saaransh" element={<Saaransh />} />
                <Route path="/panchang" element={<Panchang />} />
                
                {/* Samvaad Sub-routes */}
                <Route path="/samvaad/consultation" element={<Consultation />} />
                <Route path="/samvaad/triage" element={<Triage />} />
                
                {/* Lipi-Gyan Sub-routes */}
                <Route path="/lipi-gyan/prescription" element={<Prescription />} />
                <Route path="/lipi-gyan/lab-report" element={<LabReport />} />
                <Route path="/lipi-gyan/discharge" element={<Discharge />} />
                
                {/* Saaransh Sub-routes */}
                <Route path="/saaransh/clinical-notes" element={<ClinicalNotes />} />
                <Route path="/saaransh/action-plan" element={<ActionPlan />} />

                {/* Panchang Sub-routes */}
                {/* <Route path="/panchang/proactive" element={<Proactive />} /> */}
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;