"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { Book, Calendar, GraduationCap, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isTeacher = user?.role === "teacher"
  const isCoordinator = user?.role === "coordinator"

  const studentCards = [
    {
      title: "Clubs",
      icon: Users,
      description: "Explore various clubs and activities",
      link: "/clubs",
      color: "from-violet-500 to-purple-600",
      hoverColor: "from-violet-600 to-purple-700",
    },
    {
      title: "Attendance",
      icon: Calendar,
      description: "Check your attendance records",
      link: "/attendance",
      color: "from-cyan-500 to-blue-600",
      hoverColor: "from-cyan-600 to-blue-700",
    },
    {
      title: "Library",
      icon: Book,
      description: "Access library resources",
      link: "/library",
      color: "from-emerald-500 to-teal-600",
      hoverColor: "from-emerald-600 to-teal-700",
    },
    {
      title: "Curriculum",
      icon: GraduationCap,
      description: "View your academic curriculum",
      link: "/curriculum",
      color: "from-amber-500 to-orange-600",
      hoverColor: "from-amber-600 to-orange-700",
    },
  ]

  const teacherCards = [
    {
      title: "Library",
      icon: Book,
      description: "Access and add new resources to the library",
      link: "/library",
      color: "from-emerald-500 to-teal-600",
      hoverColor: "from-emerald-600 to-teal-700",
    },
    {
      title: "Curriculum",
      icon: GraduationCap,
      description: "View and add documents to the curriculum",
      link: "/curriculum",
      color: "from-amber-500 to-orange-600",
      hoverColor: "from-amber-600 to-orange-700",
    },
  ]

  const coordinatorCards = [
    {
      title: "Clubs",
      icon: Users,
      description: "Manage clubs, subclubs, and members",
      link: "/clubs",
      color: "from-violet-500 to-purple-600",
      hoverColor: "from-violet-600 to-purple-700",
    },
  ]

  // Choose cards based on user role
  const cards = isCoordinator ? coordinatorCards : isTeacher ? teacherCards : studentCards

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar showNavbar={true} />

      <main className="flex-grow flex flex-col">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 px-4 pb-8">
          {cards.map((card) => (
            <Card
              key={card.title}
              className={`h-[calc(100vh-12rem)] bg-gradient-to-br ${card.color} border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-gradient-to-br ${card.hoverColor} cursor-pointer overflow-hidden group`}
              onClick={() => navigate(card.link)}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300 rounded-lg"></div>
              <CardHeader className="flex flex-col items-center justify-center pt-10 pb-4 space-y-4">
                <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300">
                  <card.icon className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-white text-center">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-full pb-10">
                <p className="text-lg text-white/80 text-center max-w-xs">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Dashboard
