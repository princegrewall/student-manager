
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Code, Music, Trophy } from "lucide-react";

const Clubs = () => {
  const navigate = useNavigate();

  const clubTypes = [
    {
      title: "Sports Club",
      icon: Trophy,
      description: "Join sports activities and teams",
      link: "/clubs/sports",
    },
    {
      title: "Technical Club",
      icon: Code,
      description: "Enhance your technical skills",
      link: "/clubs/technical",
    },
    {
      title: "Cultural Club",
      icon: Music,
      description: "Participate in cultural activities",
      link: "/clubs/cultural",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F2C] text-white">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Clubs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clubTypes.map((club) => (
            <Card 
              key={club.title} 
              className="bg-[#222222] border-[#333333] hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              onClick={() => navigate(club.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xl font-bold text-white">{club.title}</CardTitle>
                <club.icon className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{club.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Clubs;
