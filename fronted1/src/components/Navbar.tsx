import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./ui/Logo";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Book, Calendar, GraduationCap, Users, Layers } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const isTeacher = user?.role === 'teacher';
  const isCoordinator = user?.role === 'coordinator';
  const isStudent = user?.role === 'student';
  const canViewSemesters = isTeacher || isCoordinator;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-[#111111] text-white p-4 border-b border-[#333333]">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-white">College Portal</Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white"
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
          
          {/* Teacher-specific navigation links */}
          {isTeacher && (
            <>
              <Link to="/library" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <Book className="h-4 w-4 mr-1" />
                Library
              </Link>
              <Link to="/curriculum" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <GraduationCap className="h-4 w-4 mr-1" />
                Curriculum
              </Link>
            </>
          )}

          {/* Student navigation links */}
          {isStudent && (
            <>
              <Link to="/clubs" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Clubs
              </Link>
              <Link to="/attendance" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Attendance
              </Link>
              <Link to="/library" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <Book className="h-4 w-4 mr-1" />
                Library
              </Link>
              <Link to="/curriculum" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <GraduationCap className="h-4 w-4 mr-1" />
                Curriculum
              </Link>
            </>
          )}

          {/* Coordinator-specific navigation - only clubs */}
          {isCoordinator && (
            <Link to="/clubs" className="text-gray-300 hover:text-white transition-colors flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Clubs
            </Link>
          )}
          
          {/* Semesters link (Teacher & Coordinator only) */}
          {canViewSemesters && (
            <Link to="/semesters" className="text-gray-300 hover:text-white transition-colors flex items-center">
              <Layers className="h-4 w-4 mr-1" />
              Semesters
            </Link>
          )}
          
          {user ? (
            <Button 
              variant="ghost" 
              className="text-white"
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <Link to="/login" className="text-white">Login</Link>
          )}
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 right-0 w-48 bg-[#111111] border border-[#333333] rounded-lg shadow-lg z-50">
            <div className="flex flex-col p-4 space-y-3">
              <Link 
                to="/dashboard" 
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              {/* Teacher-specific navigation links for mobile */}
              {isTeacher && (
                <>
                  <Link 
                    to="/library" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Book className="h-4 w-4 mr-1" />
                    Library
                  </Link>
                  <Link 
                    to="/curriculum" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Curriculum
                  </Link>
                </>
              )}

              {/* Student navigation links for mobile */}
              {isStudent && (
                <>
                  <Link 
                    to="/clubs" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Clubs
                  </Link>
                  <Link 
                    to="/attendance" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Attendance
                  </Link>
                  <Link 
                    to="/library" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Book className="h-4 w-4 mr-1" />
                    Library
                  </Link>
                  <Link 
                    to="/curriculum" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Curriculum
                  </Link>
                </>
              )}

              {/* Coordinator-specific navigation for mobile - only clubs */}
              {isCoordinator && (
                <Link 
                  to="/clubs" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Clubs
                </Link>
              )}
              
              {/* Semesters link (Teacher & Coordinator only) - Mobile */}
              {canViewSemesters && (
                <Link 
                  to="/semesters" 
                  className="text-gray-300 hover:text-white transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Semesters
                </Link>
              )}
              
              {user ? (
                <Button 
                  variant="ghost" 
                  className="text-white justify-start p-0 h-auto font-normal"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              ) : (
                <Link 
                  to="/login" 
                  className="text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
