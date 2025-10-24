
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UsersProvider } from "@/contexts/UsersContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnnouncementsProvider } from "@/contexts/AnnouncementsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { LogsProvider } from "@/contexts/LogsContext";
import { WorkShiftsProvider } from "@/contexts/WorkShiftsContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UsersProvider>
        <AnnouncementsProvider>
          <WorkShiftsProvider>
            <LogsProvider>
              <NotificationsProvider>
                <AuthProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </AuthProvider>
              </NotificationsProvider>
            </LogsProvider>
          </WorkShiftsProvider>
        </AnnouncementsProvider>
      </UsersProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;