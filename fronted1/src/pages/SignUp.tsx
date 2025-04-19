import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, UserRole } from "@/lib/auth-context";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as UserRole
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, loading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'terms') {
        setTermsAccepted(checked);
      }
    } else if (type === 'radio' && name === 'role') {
      setFormData({
        ...formData,
        role: value as UserRole
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Registration failed",
        description: "You must accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      
      // Show success toast
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully"
      });
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A1F2C] to-[#0F172A] text-white">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-6 py-24 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[calc(50%-11rem)] top-1/2 -translate-y-1/2 transform-gpu blur-3xl sm:left-[calc(50%-30rem)] sm:top-1/2">
            <div className="aspect-[1155/678] w-[36.125rem] bg-gradient-to-tr from-indigo-600 to-purple-500 opacity-20" />
          </div>
          <div className="absolute right-[calc(50%-11rem)] top-1/2 -translate-y-1/2 transform-gpu blur-3xl sm:right-[calc(50%-30rem)] sm:top-1/2">
            <div className="aspect-[1155/678] w-[36.125rem] bg-gradient-to-tr from-purple-600 to-blue-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-[#222222]/90 backdrop-blur-lg p-8 rounded-xl shadow-2xl shadow-purple-900/20 w-full max-w-md border border-[#333333]">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-bold leading-9 tracking-tight text-white">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Join our community and get started
            </p>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-200">
                  Full Name
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-white bg-[#2A2A2A] shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-200">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-white bg-[#2A2A2A] shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-200">
                  Select Your Role
                </label>
                <div className="mt-2 p-3 bg-[#2A2A2A] rounded-md border border-[#444444] shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="role-student"
                        name="role"
                        type="radio"
                        value="student"
                        checked={formData.role === 'student'}
                        onChange={handleChange}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-600"
                      />
                      <label htmlFor="role-student" className="ml-3 block text-sm font-medium leading-6 text-gray-200">
                        Student
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="role-teacher"
                        name="role"
                        type="radio"
                        value="teacher"
                        checked={formData.role === 'teacher'}
                        onChange={handleChange}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-600"
                      />
                      <label htmlFor="role-teacher" className="ml-3 block text-sm font-medium leading-6 text-gray-200">
                        Teacher
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="role-coordinator"
                        name="role"
                        type="radio"
                        value="coordinator"
                        checked={formData.role === 'coordinator'}
                        onChange={handleChange}
                        className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-600"
                      />
                      <label htmlFor="role-coordinator" className="ml-3 block text-sm font-medium leading-6 text-gray-200">
                        Coordinator
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-200">
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-white bg-[#2A2A2A] shadow-sm ring-1 ring-inset ring-[#444444] placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                />
                <label htmlFor="terms" className="ml-3 block text-sm leading-6 text-gray-300">
                  I agree to the{" "}
                  <a href="#" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-lg shadow-purple-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-70 transition-all duration-300"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-gray-300">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold leading-6 text-purple-400 hover:text-purple-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
