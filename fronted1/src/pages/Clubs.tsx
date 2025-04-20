"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import Navbar from "@/components/Navbar"
import { Code, Music, Trophy } from "lucide-react"

const Clubs = () => {
  const navigate = useNavigate()

  const clubTypes = [
    {
      title: "Sports Club",
      icon: Trophy,
      description:
        "Join sports activities and teams. Participate in competitions, improve your physical fitness, and develop teamwork skills.",
      link: "/clubs/sports",
      color: "from-rose-500 to-red-600",
      hoverColor: "from-rose-600 to-red-700",
    },
    {
      title: "Technical Club",
      icon: Code,
      description:
        "Enhance your technical skills through workshops, projects, and competitions. Learn coding, robotics, and other tech skills.",
      link: "/clubs/technical",
      color: "from-cyan-500 to-blue-600",
      hoverColor: "from-cyan-600 to-blue-700",
    },
    {
      title: "Cultural Club",
      icon: Music,
      description:
        "Participate in cultural activities including music, dance, drama, and art. Express your creativity and showcase your talents.",
      link: "/clubs/cultural",
      color: "from-amber-500 to-orange-600",
      hoverColor: "from-amber-600 to-orange-700",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-950 to-slate-900 text-white">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-5xl font-bold mb-4 text-center">Clubs</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4 pb-8 max-w-6xl mx-auto">
          {clubTypes.map((club) => (
            <Card
              key={club.title}
              className={`aspect-square bg-gradient-to-br ${club.color} border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-gradient-to-br ${club.hoverColor} cursor-pointer overflow-hidden group`}
              onClick={() => navigate(club.link)}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300 rounded-lg"></div>
              <CardHeader className="flex flex-col items-center justify-center pt-6 pb-2 space-y-2">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300">
                  <club.icon className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white text-center">{club.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-start justify-center h-full pb-6">
                <div className="overflow-y-auto max-h-[calc(100%-2rem)] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <p className="text-base text-white/80 text-center max-w-xs px-4">{club.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>


    </div>
  )
}

export default Clubs
