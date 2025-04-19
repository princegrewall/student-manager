import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, UserRole } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' as UserRole,
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, error: authError, clearError, isAuthenticated } = useAuth();

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (authError && authError.includes('registered as a')) {
      // Format role mismatch error
      const actualRole = authError.includes('registered as a') ? 
        authError.split('registered as a ')[1].split(',')[0].split('.')[0] : '';
      
      if (actualRole) {
        setLocalError(`Role mismatch: Logged in as ${formData.role} but account is ${actualRole}`);
      } else {
        setLocalError(authError);
      }
    }
  }, [authError, formData.role]);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData({
      ...formData,
      role: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setLocalError('');
    clearError();
    
    // Simple validation
    if (!formData.email || !formData.password) {
      setLocalError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      await login(formData.email, formData.password, formData.role);
    } catch (err: any) {
      // Check for role mismatch error in the error message
      if (err.message && err.message.includes('not a')) {
        const parts = err.message.split('not a ');
        if (parts.length > 1) {
          const actualRole = parts[1].split('.')[0];
          setLocalError(`Role mismatch: Logged in as ${formData.role} but account is ${actualRole}`);
        } else {
          setLocalError(err.message || 'Login failed');
        }
      } else {
        setLocalError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A1F2C] to-[#0F172A] text-white">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-6 py-24 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[calc(50%-11rem)] top-1/2 -translate-y-1/2 transform-gpu blur-3xl sm:left-[calc(50%-30rem)] sm:top-1/2">
            <div className="aspect-[1155/678] w-[36.125rem] bg-gradient-to-tr from-purple-600 to-blue-500 opacity-20" />
          </div>
          <div className="absolute right-[calc(50%-11rem)] top-1/2 -translate-y-1/2 transform-gpu blur-3xl sm:right-[calc(50%-30rem)] sm:top-1/2">
            <div className="aspect-[1155/678] w-[36.125rem] bg-gradient-to-tr from-indigo-600 to-purple-500 opacity-20" />
          </div>
        </div>
        
        <Card className="w-full max-w-md bg-[#222222]/90 backdrop-blur-lg border-[#333333] text-white shadow-2xl shadow-purple-900/20">
          <CardHeader className="space-y-2 pb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-center text-white font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-[#2A2A2A] border-[#444444] text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-[#2A2A2A] border-[#444444] text-white pr-10 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-200">Login as</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}>
                  <SelectTrigger 
                    id="role"
                    className="bg-[#2A2A2A] border-[#444444] text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-[#2A2A2A] border-[#444444] text-white">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(localError || authError) && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 shadow-md">
                  <p className="text-red-200 text-sm">{localError || authError}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all duration-300" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Login;
