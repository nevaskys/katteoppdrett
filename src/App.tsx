import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CatsList from "./pages/CatsList";
import CatDetail from "./pages/CatDetail";
import CatForm from "./pages/CatForm";
import LittersList from "./pages/LittersList";
import LitterDetail from "./pages/LitterDetail";
import LitterForm from "./pages/LitterForm";
import WaitlistPage from "./pages/WaitlistPage";
import TasksPage from "./pages/TasksPage";
import TestMating from "./pages/TestMating";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/cats" element={<CatsList />} />
                    <Route path="/cats/new" element={<CatForm />} />
                    <Route path="/cats/:id" element={<CatDetail />} />
                    <Route path="/cats/:id/edit" element={<CatForm />} />
                    <Route path="/litters" element={<LittersList />} />
                    <Route path="/litters/new" element={<LitterForm />} />
                    <Route path="/litters/:id" element={<LitterDetail />} />
                    <Route path="/litters/:id/edit" element={<LitterForm />} />
                    <Route path="/waitlist" element={<WaitlistPage />} />
                    <Route path="/waitlist/new" element={<WaitlistPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/tasks/new" element={<TasksPage />} />
                    <Route path="/test-mating" element={<TestMating />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
