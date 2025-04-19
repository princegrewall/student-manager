import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import Attendance from "./pages/attendence";
import Library from "./pages/library";
import Curriculum from "./pages/curriculum";
import SemestersPage from "./pages/semesters";
import LearnMore from "./pages/LearnMore";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
         
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/learn-more" element={<LearnMore />} />
              <Route path="/register" element={<Navigate to="/signup" />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/clubs" element={
                <ProtectedRoute requiredPermission="view:members">
                  <Clubs />
                </ProtectedRoute>
              } />
              <Route path="/clubs/:type" element={
                <ProtectedRoute requiredPermission="view:members">
                  <ClubDetails />
                </ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute requiredPermission="mark:attendance">
                  <Attendance />
                </ProtectedRoute>
              } />
              <Route path="/library" element={
                <ProtectedRoute requiredPermission="view:library">
                  <Library />
                </ProtectedRoute>
              } />
              <Route path="/curriculum" element={
                <ProtectedRoute requiredPermission="view:curriculum">
                  <Curriculum />
                </ProtectedRoute>
              } />
              <Route path="/semesters" element={
                <ProtectedRoute requiredPermission="crud:curriculum">
                  <SemestersPage />
                </ProtectedRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
              
              {/* Unauthorized route */}
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
         
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
