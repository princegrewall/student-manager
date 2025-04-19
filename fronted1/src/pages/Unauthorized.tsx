import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-20 w-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">
            You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Return to Dashboard
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Unauthorized; 