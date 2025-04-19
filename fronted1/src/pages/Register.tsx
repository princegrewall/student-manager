import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/lib/auth-context';
import { Checkbox } from '@/components/ui/checkbox';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
    agreedToTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'role') {
      setFormData({
        ...formData,
        role: e.target.value as UserRole,
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      agreedToTerms: checked
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (!formData.agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    
    try {
      setLoading(true);
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1F2C] p-4">
      <Card className="w-full max-w-md bg-[#222222] border-[#333333] text-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center text-white">Create an Account</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Enter your details to register
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">Full Name <span className="text-red-400">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className="bg-[#333333] border-[#444444] text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email <span className="text-red-400">*</span></Label>
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

            {/* Plain HTML radio buttons for role selection */}
            <div className="p-4 bg-[#2a2a2a] border border-[#444444] rounded-md">
              <p className="text-white text-base font-medium mb-2">Select your role <span className="text-red-400">*</span></p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="role-student"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="role-student" className="text-white cursor-pointer">Student</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="role-teacher"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="role-teacher" className="text-white cursor-pointer">Teacher</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="role-coordinator"
                    name="role"
                    value="coordinator"
                    checked={formData.role === 'coordinator'}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="role-coordinator" className="text-white cursor-pointer">Coordinator</label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">Password <span className="text-red-400">*</span></Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="bg-[#333333] border-[#444444] text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password <span className="text-red-400">*</span></Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-[#333333] border-[#444444] text-white"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={formData.agreedToTerms}
                onCheckedChange={handleCheckboxChange}
                className="border-gray-400 data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-purple-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-purple-400 hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            
            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4" 
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register; 