import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import SemesterFlashcards from '@/components/SemesterFlashcards';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth-context';
import { RefreshCw, GraduationCap, AlertCircle } from 'lucide-react';

const SemestersPage = () => {
  const { isAuthenticated, hasPermission, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  
  // Check if the user has permission to access this page
  const canAccessPage = user && (user.role === 'teacher' || user.role === 'coordinator');
  
  // Redirect students to the dashboard if they try to access this page
  useEffect(() => {
    if (isAuthenticated && !canAccessPage) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, canAccessPage, navigate]);
  
  // Force refresh of flashcards
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // If user is not authorized to view this page, show an unauthorized message
  if (isAuthenticated && !canAccessPage) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-950 to-slate-900">
        <Navbar />
        <main className="flex-grow container mx-auto py-8 px-4 flex items-center justify-center">
          <div className="text-center p-8 max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-100">
            <AlertCircle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h1>
            <p className="text-gray-600 mb-4">
              Only teachers and coordinators can access the semester management page.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Return to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-950 to-slate-900">
      <Navbar />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8 bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-indigo-100">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 mr-3 text-indigo-600" />
            <h1 className="text-3xl font-bold text-white">Academic Semesters</h1>
          </div>
          
          <Button
            variant="outline"
            className="flex items-center bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-300 transition-colors"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <p className="text-white mb-8 bg-slate-800/40 backdrop-blur-sm p-4 rounded-lg border border-indigo-100">
          View and manage curriculum materials and library resources for all semesters.
          {(!hasPermission('crud:curriculum') && !hasPermission('crud:library')) && 
            " You currently have view-only access."}
        </p>
        
        {/* Render the semester flashcards component */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-100 p-6">
          <SemesterFlashcards key={refreshKey} />
        </div>
      </main>
    </div>
  );
};

export default SemestersPage; 