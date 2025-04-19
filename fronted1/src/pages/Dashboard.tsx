import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Book, Calendar, GraduationCap, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isTeacher = user?.role === 'teacher';
  const isCoordinator = user?.role === 'coordinator';

  const studentCards = [
    {
      title: "Clubs",
      icon: Users,
      description: "Explore various clubs and activities",
      link: "/clubs",
    },
    {
      title: "Attendance",
      icon: Calendar,
      description: "Check your attendance records",
      link: "/attendance",
    },
    {
      title: "Library",
      icon: Book,
      description: "Access library resources",
      link: "/library",
    },
    {
      title: "Curriculum",
      icon: GraduationCap,
      description: "View your academic curriculum",
      link: "/curriculum",
    },
  ];

  const teacherCards = [
    {
      title: "Library",
      icon: Book,
      description: "Access and add new resources to the library",
      link: "/library",
    },
    {
      title: "Curriculum",
      icon: GraduationCap,
      description: "View and add documents to the curriculum",
      link: "/curriculum",
    },
  ];

  const coordinatorCards = [
    {
      title: "Clubs",
      icon: Users,
      description: "Manage clubs, subclubs, and members",
      link: "/clubs",
    },
  ];

  // Choose cards based on user role
  const cards = isCoordinator ? coordinatorCards : (isTeacher ? teacherCards : studentCards);

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Card 
              key={card.title} 
              className="bg-[#222222] border-[#333333] hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              onClick={() => navigate(card.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xl font-bold text-white">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
