import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

  // Watch for auth errors from the context
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
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-6 py-24 lg:px-8">
        <Card className="w-full max-w-md bg-[#222222] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Login</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-[#333333] border-[#444444] text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-[#333333] border-[#444444] text-white pr-10"
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? 
                      <EyeOff className="h-4 w-4 text-gray-400" /> : 
                      <Eye className="h-4 w-4 text-gray-400" />
                    }
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Login as</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}>
                  <SelectTrigger 
                    id="role"
                    className="bg-[#333333] border-[#444444] text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-[#333333] border-[#444444] text-white">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(localError || authError) && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{localError || authError}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
