import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./ui/Logo";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Book, Calendar, GraduationCap, Users, Layers, Info } from "lucide-react";

interface NavbarProps {
  showNavbar?: boolean;
}

const Navbar = ({ showNavbar = true }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const isTeacher = user?.role === 'teacher';
  const isCoordinator = user?.role === 'coordinator';
  const isStudent = user?.role === 'student';
  const canViewSemesters = isTeacher || isCoordinator;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  if (!showNavbar) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-indigo-900 via-purple-700 to-indigo-500 text-white px-6 py-4 border-b border-purple-700/30 shadow-lg backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white hover:text-purple-300 transition-all duration-300 transform hover:scale-105">
          College Portal
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white hover:text-purple-300 transition-colors duration-200"
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105">Dashboard</Link>
              
              {/* Teacher-specific navigation links */}
              {isTeacher && (
                <>
                  <Link to="/library" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                    <Book className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Library
                  </Link>
                  <Link to="/curriculum" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                    <GraduationCap className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Curriculum
                  </Link>
                </>
              )}

              {/* Student navigation links */}
              {isStudent && (
                <>
                  <Link to="/clubs" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                    <Users className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Clubs
                  </Link>
                  <Link to="/attendance" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                    <Calendar className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Attendance
                  </Link>
                  <Link to="/library" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                    <Book className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Library
                  </Link>
                  <Link to="/curriculum" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                    <GraduationCap className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Curriculum
                  </Link>
                </>
              )}

              {/* Coordinator-specific navigation - only clubs */}
              {isCoordinator && (
                <Link to="/clubs" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                  <Users className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                  Clubs
                </Link>
              )}
              
              {/* Semesters link (Teacher & Coordinator only) */}
              {canViewSemesters && (
                <Link to="/semesters" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                  <Layers className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                  Semesters
                </Link>
              )}
              
              <Button 
                variant="ghost" 
                className="text-white hover:text-purple-300 hover:bg-purple-900/50 transition-all duration-300"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/learn-more" className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:scale-105 flex items-center group">
                <Info className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                Learn More
              </Link>
              <button 
                onClick={handleLoginClick}
                className="text-white hover:text-purple-300 transition-all duration-300 font-medium cursor-pointer px-4 py-2 rounded-md hover:bg-purple-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transform hover:scale-105"
              >
                Login
              </button>
              <button 
                onClick={handleSignupClick}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-md transition-all duration-300 hover:from-purple-500 hover:to-indigo-500 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                Signup
              </button>
            </>
          )}
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 right-0 w-64 bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-md border border-purple-700/30 rounded-lg shadow-xl z-50 transform transition-all duration-300 ease-in-out">
            <div className="flex flex-col p-4 space-y-3">
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  {/* Teacher-specific navigation links for mobile */}
                  {isTeacher && (
                    <>
                      <Link 
                        to="/library" 
                        className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Book className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Library
                      </Link>
                      <Link 
                        to="/curriculum" 
                        className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <GraduationCap className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Curriculum
                      </Link>
                    </>
                  )}

                  {/* Student navigation links for mobile */}
                  {isStudent && (
                    <>
                      <Link 
                        to="/clubs" 
                        className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Clubs
                      </Link>
                      <Link 
                        to="/attendance" 
                        className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Attendance
                      </Link>
                      <Link 
                        to="/library" 
                        className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Book className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Library
                      </Link>
                      <Link 
                        to="/curriculum" 
                        className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <GraduationCap className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                        Curriculum
                      </Link>
                    </>
                  )}

                  {/* Coordinator-specific navigation for mobile - only clubs */}
                  {isCoordinator && (
                    <Link 
                      to="/clubs" 
                      className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Users className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                      Clubs
                    </Link>
                  )}
                  
                  {/* Semesters link (Teacher & Coordinator only) - Mobile */}
                  {canViewSemesters && (
                    <Link 
                      to="/semesters" 
                      className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Layers className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                      Semesters
                    </Link>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-purple-300 hover:bg-purple-900/50 transition-all duration-300 justify-start p-0 h-auto font-normal"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/learn-more" 
                    className="text-gray-200 hover:text-purple-300 transition-all duration-300 hover:translate-x-2 flex items-center group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Info className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
                    Learn More
                  </Link>
                  <button 
                    onClick={() => {
                      handleLoginClick();
                      setIsMenuOpen(false);
                    }}
                    className="text-white hover:text-purple-300 transition-all duration-300 font-medium cursor-pointer px-4 py-2 rounded-md hover:bg-purple-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => {
                      handleSignupClick();
                      setIsMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-md transition-all duration-300 hover:from-purple-500 hover:to-indigo-500 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 shadow-lg hover:shadow-purple-500/25"
                  >
                    Signup
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
