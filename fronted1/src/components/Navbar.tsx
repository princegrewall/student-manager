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
    <nav className="bg-gradient-to-r from-[#1f1f1f] via-[#222222] to-[#1f1f1f] text-white px-6 py-4 border-b border-[#2e2e2e] shadow-md flex items-center justify-between">
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
          {user ? (
            <>
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
              
              <Button 
                variant="ghost" 
                className="text-white"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/learn-more" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Learn More
              </Link>
              <button 
                onClick={handleLoginClick}
                className="text-white hover:text-purple-400 transition-colors font-medium cursor-pointer px-3 py-1 rounded-md hover:bg-purple-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                Login
              </button>
              <button 
                onClick={handleSignupClick}
                className="bg-purple-600 text-white px-4 py-2 rounded-md transition-colors hover:bg-purple-400 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                Signup
              </button>
            </>
          )}
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 right-0 w-48 bg-[#111111] border border-[#333333] rounded-lg shadow-lg z-50">
            <div className="flex flex-col p-4 space-y-3">
              {user ? (
                <>
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
                </>
              ) : (
                <>
                  <Link 
                    to="/learn-more" 
                    className="text-gray-300 hover:text-white transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Learn More
                  </Link>
                  <button 
                    onClick={() => {
                      handleLoginClick();
                      setIsMenuOpen(false);
                    }}
                    className="text-white hover:text-purple-400 transition-colors font-medium cursor-pointer px-3 py-1 rounded-md hover:bg-purple-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => {
                      handleSignupClick();
                      setIsMenuOpen(false);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md transition-colors hover:bg-purple-400 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
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
