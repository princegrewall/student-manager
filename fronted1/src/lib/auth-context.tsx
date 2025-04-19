import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

// Define the types of users
export type UserRole = 'student' | 'teacher' | 'coordinator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasPermission: (permission: Permission) => boolean;
}

// Define all possible permissions in the system
export type Permission = 
  // Student permissions
  | 'view:curriculum'
  | 'view:library'
  | 'mark:attendance'
  | 'add:subjects'
  | 'view:events'
  | 'view:members'
  
  // Teacher permissions
  | 'crud:library'
  | 'crud:curriculum'
  
  // Coordinator permissions
  | 'crud:clubs'
  | 'crud:events'
  | 'add:students';

// Map roles to permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  student: [
    'view:curriculum', // Students can only view curriculum
    'view:library',    // Students can only view library
    'mark:attendance', // Students can mark their own attendance
    'add:subjects',    // Students can add subjects for their attendance
    'view:events',     // Students can only view events
    'view:members'     // Students can only view members
  ],
  teacher: [
    'crud:library',    // Teachers can add and manage library content
    'crud:curriculum', // Teachers can add and manage curriculum content
    'view:library',    // Teachers can view library content
    'view:curriculum', // Teachers can view curriculum content
    'view:events',     // Teachers can view events
    'view:members'     // Teachers can view members
  ],
  coordinator: [
    'crud:clubs',      // Only coordinators can manage clubs
    'crud:events',     // Only coordinators can create and manage events
    'add:students',    // Only coordinators can add students to clubs
    'view:curriculum', // Coordinators can view curriculum
    'view:library',    // Coordinators can view library
    'view:members'     // Coordinators can view members
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if there's a stored token on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Fetch current user profile
        const userData = await authAPI.getProfile();
        
        if (userData) {
          setUser({
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role || 'student' // Default to student if role not specified
          });
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Logging in as ${role} with email: ${email}`);
      
      // Call the appropriate login endpoint based on role
      const endpoint = role === 'student' ? 'login' : `${role}/login`;
      
      try {
        // Add role to the query parameters or body if needed
        const response = await authAPI.login(email, password, endpoint);
        
        if (response.token) {
          localStorage.setItem('token', response.token);
          
          // Fetch user profile after login
          try {
            const userData = await authAPI.getProfile();
            
            console.log("User profile retrieved:", userData);
            const userRole = userData.data?.role || userData.role;
            
            if (!userRole) {
              console.error("Error: User role not found in profile data", userData);
              throw new Error("Authentication error: User role not found");
            }
            
            // Verify the role matches what's expected
            if (userRole !== role) {
              console.warn(`Role mismatch: Logged in as ${role} but account is ${userRole}`);
              setError(`This account is registered as a ${userRole}, not a ${role}. Please log in with the correct role.`);
              localStorage.removeItem('token');
              setLoading(false);
              return;
            }
            
            // Set user with correct data
            setUser({
              id: userData.data?._id || userData._id || '',
              name: userData.data?.name || userData.name,
              email: userData.data?.email || userData.email,
              role: userRole
            });
          } catch (profileError) {
            console.error("Error fetching user profile:", profileError);
            localStorage.removeItem('token');
            throw new Error("Failed to retrieve user profile after login");
          }
        }
      } catch (loginError: any) {
        console.error("Login error:", loginError);
        setError(loginError.message || 'Login failed. Please check your credentials and try again.');
        throw loginError;
      }
    } catch (err: any) {
      console.error("Overall login process error:", err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the appropriate register endpoint based on role
      const endpoint = role === 'student' ? 'register' : `${role}/register`;
      
      try {
        const response = await authAPI.register({ name, email, password, role }, endpoint);
        
        if (response.token) {
          localStorage.setItem('token', response.token);
          
          // Fetch user profile after registration to get complete data
          try {
            const userData = await authAPI.getProfile();
            
            const userRole = userData.data?.role || userData.role || role;
            
            setUser({
              id: userData.data?._id || userData._id || response.id || '',
              name: userData.data?.name || userData.name || name,
              email: userData.data?.email || userData.email || email,
              role: userRole
            });
          } catch (profileError) {
            console.error("Error fetching user profile after registration:", profileError);
            // Fallback to using the data we already have
            setUser({
              id: response.id || '',
              name,
              email,
              role
            });
          }
        }
      } catch (registerError: any) {
        console.error("Registration error:", registerError);
        setError(registerError.message || 'Registration failed. Please try again.');
        throw registerError;
      }
    } catch (err: any) {
      console.error("Overall registration process error:", err);
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Function to check if the current user has a specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (!user.role || !rolePermissions[user.role]) return false;
    return rolePermissions[user.role].includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 