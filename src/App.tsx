import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Staff from "./pages/Staff";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Appointments from "./pages/Appointments";
import Consultations from "./pages/Consultations";
import LabResults from "./pages/LabResults";
import Prescriptions from "./pages/Prescriptions";
import NotFound from "./pages/NotFound";
import { AuthProvider as OIDCAuthProvider } from "@/auth/AuthProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OIDCAuthProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:id" element={<PatientDetail />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/consultations" element={<Consultations />} />
                <Route path="/lab" element={<LabResults />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AuthProvider>
      </OIDCAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
