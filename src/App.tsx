import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Embed from "./pages/Embed";
import Iframe from "./pages/Iframe";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AgentCustomize from "./pages/AgentCustomize";
import AgentCreate from "./pages/AgentCreate";
import AgentConversationHistory from "./pages/AgentConversationHistory";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";
import RouteLogger from "./components/RouteLogger";
import ChatbotPreviewPage from "@/pages/ChatbotPreviewPage";

const queryClient = new QueryClient();

const App = () => {
  const navigate = useNavigate();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider navigate={navigate}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
              <Route path="/" element={<RouteLogger path="/"><Index /></RouteLogger>} />
              <Route path="/auth" element={<RouteLogger path="/auth"><Auth /></RouteLogger>} />
              <Route path="/auth/callback" element={<RouteLogger path="/auth/callback"><AuthCallback /></RouteLogger>} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <RouteLogger path="/admin"><AdminDashboard /></RouteLogger>
                </ProtectedRoute>
              } />
              <Route path="/admin/agent/:agentId" element={
                <ProtectedRoute>
                  <RouteLogger path="/admin/agent/:agentId"><AgentDashboard /></RouteLogger>
                </ProtectedRoute>
              } />
              <Route path="/admin/agent/:agentId/customize" element={
                <ProtectedRoute>
                  <RouteLogger path="/admin/agent/:agentId/customize"><AgentCustomize /></RouteLogger>
                </ProtectedRoute>
              } />
              <Route path="/admin/agent/:agentId/history" element={
                <ProtectedRoute>
                  <RouteLogger path="/admin/agent/:agentId/history"><AgentConversationHistory /></RouteLogger>
                </ProtectedRoute>
              } />
              <Route path="/admin/agent/new/customize" element={
                <ProtectedRoute>
                  <RouteLogger path="/admin/agent/new/customize"><AgentCreate /></RouteLogger>
                </ProtectedRoute>
              } />
              <Route path="/embed" element={<RouteLogger path="/embed"><Embed /></RouteLogger>} />
              <Route path="/embed/:agentId" element={<RouteLogger path="/embed/:agentId"><Embed /></RouteLogger>} />
              <Route path="/iframe" element={<RouteLogger path="/iframe"><Iframe /></RouteLogger>} />
              <Route path="/iframe/:agentId" element={<RouteLogger path="/iframe/:agentId"><Iframe /></RouteLogger>} />
              <Route path="/chatbot-preview/:agentId" element={<RouteLogger path="/chatbot-preview/:agentId"><ChatbotPreviewPage /></RouteLogger>} />
              <Route path="*" element={<RouteLogger path="*"><NotFound /></RouteLogger>} />
            </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
