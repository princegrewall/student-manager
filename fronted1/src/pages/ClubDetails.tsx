"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import Navbar from "@/components/Navbar"
import { Trophy, Code, Music, Users, Calendar, MapPin, Layers, Trash2, UserMinus, User } from "lucide-react"
import { clubsAPI, eventsAPI, adminAPI } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"

interface Student {
  _id: string
  name: string
  email: string
}

interface Event {
  _id: string
  title: string
  description: string
  date: string
  clubType: string
  location: string
  organizer: string
}

interface Subclub {
  _id?: string
  name: string
  description: string
  members: string[]
  createdAt: string
}

// Define default subclubs for each club type if they don't exist yet
const defaultSubclubs = {
  technical: [
    { name: "Coding", description: "Programming and software development" },
    { name: "Web Development", description: "Frontend and backend web technologies" },
    { name: "Robotics", description: "Building and programming robots" },
    { name: "AI/ML", description: "Artificial Intelligence and Machine Learning" },
  ],
  cultural: [
    { name: "Dance", description: "All dance forms and choreography" },
    { name: "Music", description: "Singing, instruments, and composition" },
    { name: "Drama", description: "Theater and performing arts" },
    { name: "Art", description: "Drawing, painting, and visual arts" },
  ],
  sports: [
    { name: "Cricket", description: "Cricket team and practice" },
    { name: "Football", description: "Football/soccer team and training" },
    { name: "Basketball", description: "Basketball team and practice" },
    { name: "Table Tennis", description: "Table tennis matches and practice" },
  ],
}

// Define gradient colors for each club type
const clubGradients = {
  technical: {
    colors: [
      { color: "from-cyan-500 to-blue-600", hoverColor: "from-cyan-600 to-blue-700" },
      { color: "from-indigo-500 to-purple-600", hoverColor: "from-indigo-600 to-purple-700" },
      { color: "from-sky-500 to-blue-600", hoverColor: "from-sky-600 to-blue-700" },
      { color: "from-blue-500 to-violet-600", hoverColor: "from-blue-600 to-violet-700" },
    ],
  },
  cultural: {
    colors: [
      { color: "from-rose-500 to-pink-600", hoverColor: "from-rose-600 to-pink-700" },
      { color: "from-amber-500 to-orange-600", hoverColor: "from-amber-600 to-orange-700" },
      { color: "from-pink-500 to-purple-600", hoverColor: "from-pink-600 to-purple-700" },
      { color: "from-red-500 to-rose-600", hoverColor: "from-red-600 to-rose-700" },
    ],
  },
  sports: {
    colors: [
      { color: "from-emerald-500 to-teal-600", hoverColor: "from-emerald-600 to-teal-700" },
      { color: "from-green-500 to-emerald-600", hoverColor: "from-green-600 to-emerald-700" },
      { color: "from-lime-500 to-green-600", hoverColor: "from-lime-600 to-green-700" },
      { color: "from-teal-500 to-cyan-600", hoverColor: "from-teal-600 to-cyan-700" },
    ],
  },
}

const ClubDetails = () => {
  const { type } = useParams<{ type: string }>()
  const { hasPermission, user } = useAuth()
  const navigate = useNavigate()

  const [members, setMembers] = useState<Student[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [joiningClub, setJoiningClub] = useState(false)

  // Subclub states
  const [subclubs, setSubclubs] = useState<Subclub[]>([])
  const [selectedSubclub, setSelectedSubclub] = useState<Subclub | null>(null)
  const [subclubMembers, setSubclubMembers] = useState<Student[]>([])
  const [isSubclubMember, setIsSubclubMember] = useState(false)
  const [joiningSubclub, setJoiningSubclub] = useState(false)
  const [loadingSubclub, setLoadingSubclub] = useState(false)
  const [newSubclub, setNewSubclub] = useState({ name: "", description: "" })

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  })

  // State for adding student to club
  const [studentEmail, setStudentEmail] = useState("")
  const [addingStudent, setAddingStudent] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)

  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  const [confirmDeleteClub, setConfirmDeleteClub] = useState(false)
  const [subclubToDelete, setSubclubToDelete] = useState<Subclub | null>(null)

  // State for student to remove from subclub
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)

  const title = type ? `${type.charAt(0).toUpperCase()}${type.slice(1)} Club` : "Club"

  // Check if user is coordinator - only coordinators should have these permissions
  const isCoordinator = user?.role === "coordinator"

  // Check if user can create events - only coordinators
  const canCreateEvents = isCoordinator && hasPermission("crud:events")

  // Check if user can add students to clubs - only coordinators
  const canAddStudents = isCoordinator && hasPermission("add:students")

  // Check if user can create subclubs - only coordinators
  const canCreateSubclubs = isCoordinator && hasPermission("crud:clubs")

  const getClubIcon = () => {
    if (type === "sports") return Trophy
    if (type === "technical") return Code
    if (type === "cultural") return Music
    return Users
  }

  const ClubIcon = getClubIcon()

  // Check if the current user is a member of the club
  const checkMembership = async () => {
    if (!type) return

    try {
      const membershipStatus = await clubsAPI.isClubMember(type)
      console.log(`Club membership status: ${membershipStatus}`)
      setIsMember(membershipStatus)
    } catch (err) {
      console.error("Error checking club membership:", err)
      setIsMember(false)
    }
  }

  // Fetch club members and events
  useEffect(() => {
    const fetchData = async () => {
      if (!type) return

      try {
        setLoading(true)
        setError(null)

        // Pre-initialize empty arrays
        setMembers([])
        setEvents([])
        setSubclubs([])

        console.log(`Starting data fetching for club type: ${type}`)

        // Check if the user is a member of the club
        await checkMembership()

        // Fetch club members
        try {
          console.log(`Fetching members for club: ${type}`)
          const membersData = await clubsAPI.getClubMembers(type)
          console.log(`Got ${membersData.length} members`)
          setMembers(membersData)
        } catch (membersError) {
          console.error("Error fetching club members:", membersError)
        }

        // Fetch club events
        try {
          console.log(`Fetching events for club: ${type}`)
          const eventsData = await eventsAPI.getEvents(type)
          console.log(`Got ${eventsData?.length || 0} events`)
          if (Array.isArray(eventsData)) {
            setEvents(eventsData)
          } else {
            console.error("Unexpected events data format:", eventsData)
          }
        } catch (eventsError) {
          console.error("Error fetching club events:", eventsError)
        }

        // Only fetch or create subclubs if user has permission
        if (hasPermission("crud:clubs") || hasPermission("view:members")) {
          try {
            console.log(`Fetching subclubs for club: ${type}`)
            const subclubsData = await clubsAPI.getSubclubs(type)

            if (Array.isArray(subclubsData) && subclubsData.length > 0) {
              console.log(`Got ${subclubsData.length} subclubs`)
              setSubclubs(subclubsData)
            } else {
              console.log("No subclubs found, using defaults")
              // Use default subclubs for this club type if none exist
              const defaultsForType = type && defaultSubclubs[type as keyof typeof defaultSubclubs]
              if (defaultsForType) {
                // Create the default subclubs in the backend only if coordinator
                const createdSubclubs = []
                for (const defaultSubclub of defaultsForType) {
                  try {
                    if (hasPermission("crud:clubs")) {
                      console.log(`Creating default subclub: ${defaultSubclub.name}`)
                      const createdSubclub = await clubsAPI.createSubclub(type, defaultSubclub)
                      createdSubclubs.push(createdSubclub)
                    } else {
                      // Just add to UI for display, don't create in backend
                      createdSubclubs.push({
                        ...defaultSubclub,
                        members: [],
                        createdAt: new Date().toISOString(),
                      })
                    }
                  } catch (error) {
                    console.error(`Error creating default subclub ${defaultSubclub.name}:`, error)
                    // Still add to UI even if creation fails
                    createdSubclubs.push({
                      ...defaultSubclub,
                      members: [],
                      createdAt: new Date().toISOString(),
                    })
                  }
                }
                setSubclubs(createdSubclubs)
              }
            }
          } catch (subclubsError) {
            console.error("Error fetching subclubs:", subclubsError)
            // Use default subclubs on error, but don't try to create them (to avoid loops)
            const defaultsForType = type && defaultSubclubs[type as keyof typeof defaultSubclubs]
            if (defaultsForType) {
              setSubclubs(
                defaultsForType.map((sc) => ({
                  ...sc,
                  members: [],
                  createdAt: new Date().toISOString(),
                })),
              )
            }
          }
        }
      } catch (err) {
        console.error("Error in data fetching:", err)
        setError("Failed to load club data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (type) {
      fetchData()
    }
  }, [type, hasPermission])

  // Handle joining the club
  const handleJoinClub = async () => {
    if (!type) return

    // Only allow coordinators to join clubs
    if (user?.role !== "coordinator") {
      setError("You don't have permission to join clubs")
      return
    }

    try {
      setJoiningClub(true)
      setError(null)

      const response = await clubsAPI.joinClub(type)
      console.log("Joined club successfully:", response)

      // Update the membership status
      setIsMember(true)

      // Refresh the members list
      const updatedMembers = await clubsAPI.getClubMembers(type)
      setMembers(updatedMembers)
    } catch (err: any) {
      console.error("Error joining club:", err)
      setError(err.message || "Failed to join club")
    } finally {
      setJoiningClub(false)
    }
  }

  // Handle selecting a subclub
  const handleSelectSubclub = async (subclub: Subclub) => {
    if (!type) return

    try {
      setSelectedSubclub(subclub)
      setLoadingSubclub(true)
      setSubclubMembers([])

      // Try to check if user is a member of this subclub
      let isMember = false
      try {
        if (subclub.name) {
          isMember = await clubsAPI.isSubclubMember(type, subclub.name)
        }
      } catch (membershipError) {
        console.log(`Error checking membership, subclub might not exist yet:`, membershipError)
        // If the subclub doesn't exist yet in the backend but is shown in the UI
        // Create it now before continuing
        if (membershipError.message?.includes("not found")) {
          try {
            console.log(`Creating missing subclub: ${subclub.name}`)
            await clubsAPI.createSubclub(type, {
              name: subclub.name,
              description: subclub.description,
            })
            console.log(`Successfully created subclub: ${subclub.name}`)
          } catch (createError) {
            console.error(`Failed to create subclub: ${subclub.name}`, createError)
          }
        }
      }
      setIsSubclubMember(isMember)

      // Try to get subclub members
      try {
        const members = await clubsAPI.getSubclubMembers(type, subclub.name)
        setSubclubMembers(members)
      } catch (membersError) {
        console.error(`Error getting subclub members:`, membersError)
        setSubclubMembers([])
      }
    } catch (err) {
      console.error(`Error getting subclub details:`, err)
    } finally {
      setLoadingSubclub(false)
    }
  }

  // Handle joining a subclub
  const handleJoinSubclub = async () => {
    if (!type || !selectedSubclub) return

    // Only allow admins/coordinators to join subclubs
    if (user?.role !== "coordinator") {
      setError("You don't have permission to join subclubs")
      return
    }

    try {
      setJoiningSubclub(true)
      setError(null)

      try {
        // If not a main club member yet, join the main club first silently
        if (!isMember) {
          console.log("Auto-joining main club first")
          await clubsAPI.joinClub(type)
          setIsMember(true)
        }

        await clubsAPI.joinSubclub(type, selectedSubclub.name)
        console.log(`Joined subclub ${selectedSubclub.name} successfully`)

        // Update the membership status
        setIsSubclubMember(true)

        // Refresh the subclub members
        const updatedMembers = await clubsAPI.getSubclubMembers(type, selectedSubclub.name)
        setSubclubMembers(updatedMembers)
      } catch (joinError: any) {
        console.error(`Error joining subclub:`, joinError)

        // If the error is that the subclub doesn't exist, create it and try again
        if (joinError.message?.includes("not found")) {
          try {
            console.log(`Creating missing subclub before joining: ${selectedSubclub.name}`)
            await clubsAPI.createSubclub(type, {
              name: selectedSubclub.name,
              description: selectedSubclub.description || "",
            })
            console.log(`Successfully created subclub: ${selectedSubclub.name}`)

            // If not a main club member yet, join the main club first silently
            if (!isMember) {
              console.log("Auto-joining main club first")
              await clubsAPI.joinClub(type)
              setIsMember(true)
            }

            // Now try to join again
            await clubsAPI.joinSubclub(type, selectedSubclub.name)
            console.log(`Joined subclub ${selectedSubclub.name} successfully after creating it`)

            // Update the membership status
            setIsSubclubMember(true)

            // Refresh the subclub members
            const updatedMembers = await clubsAPI.getSubclubMembers(type, selectedSubclub.name)
            setSubclubMembers(updatedMembers)
          } catch (createError) {
            console.error(`Failed to create and join subclub:`, createError)
            setError(`Failed to join subclub: ${createError.message || "Unknown error"}`)
          }
        } else {
          setError(joinError.message || "Failed to join subclub")
        }
      }
    } catch (err: any) {
      console.error(`Error in join subclub process:`, err)
      setError(err.message || "Failed to join subclub")
    } finally {
      setJoiningSubclub(false)
    }
  }

  // Handle creating a new subclub
  const handleCreateSubclub = async () => {
    if (!type) return

    try {
      if (!newSubclub.name) {
        setError("Please provide a name for the subclub")
        return
      }

      setLoading(true)
      setError(null)

      const createdSubclub = await clubsAPI.createSubclub(type, newSubclub)
      console.log("Created new subclub:", createdSubclub)

      // Add the new subclub to the list
      setSubclubs((prevSubclubs) => [
        ...prevSubclubs,
        {
          ...createdSubclub,
          members: [],
          createdAt: new Date().toISOString(),
        },
      ])

      // Reset the form
      setNewSubclub({ name: "", description: "" })
    } catch (err: any) {
      console.error("Error creating subclub:", err)
      setError(err.message || "Failed to create subclub")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!type) return

    // If not a member and not a coordinator, show error and return early
    if (!isMember && user?.role !== "coordinator") {
      setError("You need to be a member of this club to create events. Please join the club first.")
      return
    }

    try {
      setError(null)
      setLoading(true)

      if (!newEvent.title || !newEvent.description || !newEvent.date) {
        setError("Please fill in all required fields")
        setLoading(false)
        return
      }

      const eventData = {
        ...newEvent,
        clubType: type,
      }

      console.log("Creating event with data:", eventData)

      try {
        const response = await eventsAPI.createEvent(eventData)
        console.log("Event created successfully:", response)

        // Add new event to state
        if (response) {
          setEvents((prevEvents) => [...prevEvents, response])
        }

        // Reset form
        setNewEvent({
          title: "",
          description: "",
          date: "",
          location: "",
        })

        // Close dialog
        const closeButton = document.querySelector("[data-radix-collection-item]") as HTMLElement
        if (closeButton) closeButton.click()
      } catch (err: any) {
        console.error("Error creating event:", err)

        if (err.message?.includes("Club not found")) {
          setError("Unable to create event. Club not found.")
        } else if (err.message?.includes("not authorized") || err.message?.includes("to be a member")) {
          setError("You need to be a member of this club or a coordinator to create events.")
        } else {
          setError(err.message || "Failed to create event. Please try again.")
        }
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Handle adding a student to a subclub
  const handleAddStudentToClub = async () => {
    if (!type || !studentEmail || !selectedSubclub) {
      setStudentError("Please select a subclub and enter a student email")
      return
    }

    // Ensure only coordinators can add students
    if (user?.role !== "coordinator") {
      setStudentError("Only coordinators can add students to subclubs")
      return
    }

    try {
      setAddingStudent(true)
      setStudentError(null)

      // Validate email
      if (!studentEmail.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        setStudentError("Please enter a valid email address")
        setAddingStudent(false)
        return
      }

      console.log(`Adding student ${studentEmail} to ${selectedSubclub.name} subclub in ${type} club`)

      try {
        // Call the API to add the student
        await adminAPI.addStudentToClub(studentEmail, type, selectedSubclub.name)
        console.log(`Successfully added student to subclub ${selectedSubclub.name}`)

        // Clear form
        setStudentEmail("")

        // Refresh the subclub members
        const updatedSubclubMembers = await clubsAPI.getSubclubMembers(type, selectedSubclub.name)
        setSubclubMembers(updatedSubclubMembers)
      } catch (err) {
        console.error("Error adding student to subclub:", err)

        if (err.message && err.message.includes("not found")) {
          if (err.message.includes("Student not found")) {
            setStudentError(
              `Error: The email "${studentEmail}" is not registered in the system. Only registered students can be added to clubs.`,
            )
          } else {
            setStudentError(`Error: ${err.message}. Please try a different subclub.`)
          }
        } else {
          setStudentError(`Error: ${err.message || "Failed to add student to subclub"}`)
        }
      }
    } finally {
      setAddingStudent(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      setLoading(true)
      setError(null)

      // Ensure only coordinators can delete events
      if (user?.role !== "coordinator") {
        setError("Only coordinators can delete events")
        setLoading(false)
        return
      }

      console.log(`Deleting event with ID: ${eventToDelete}`)

      try {
        await eventsAPI.deleteEvent(eventToDelete)
        console.log("Event deleted successfully")

        // Update the events list after deletion
        setEvents(events.filter((event) => event._id !== eventToDelete))

        // Close the confirmation dialog
        setEventToDelete(null)
      } catch (err: any) {
        console.error("Error deleting event:", err)
        setError(err.message || "Failed to delete event. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle subclub deletion
  const handleDeleteSubclub = async () => {
    if (!subclubToDelete || !type) return

    try {
      setLoading(true)
      setError(null)

      // Ensure only coordinators can delete subclubs
      if (user?.role !== "coordinator") {
        setError("Only coordinators can delete subclubs")
        setLoading(false)
        return
      }

      console.log(`Deleting subclub with name: ${subclubToDelete.name}`)

      let deleteSuccessful = false

      try {
        await clubsAPI.deleteSubclub(type, subclubToDelete.name)
        console.log("Subclub deleted successfully")
        deleteSuccessful = true
      } catch (err: any) {
        console.error("Error deleting subclub:", err)

        // If we get a 404 error, the subclub might not exist in the backend
        // but we still want to remove it from the UI
        if (err.message?.includes("404")) {
          console.log("Subclub doesn't exist in backend, but proceeding with UI update")
          // Show informative message that the backend endpoint may be missing
          setError("Subclub removed from view. The backend API endpoint for deletion may need to be implemented.")
          deleteSuccessful = true // Still consider it a success for UI purposes
        } else {
          setError(err.message || "Failed to delete subclub")
        }
      }

      // Only update UI if delete was successful or got a 404 error
      if (deleteSuccessful) {
        // Update the subclubs list after deletion
        setSubclubs(subclubs.filter((subclub) => subclub.name !== subclubToDelete.name))

        // Close dialog
        setSubclubToDelete(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClub = async () => {
    if (!type) return

    try {
      setLoading(true)
      setError(null)

      // Ensure only coordinators can delete clubs
      if (user?.role !== "coordinator") {
        setError("Only coordinators can delete clubs")
        setLoading(false)
        return
      }

      console.log(`Deleting club: ${type}`)

      try {
        await clubsAPI.deleteClub(type)
        console.log("Club deleted successfully")

        // Redirect to clubs list after deletion
        navigate("/clubs")
      } catch (err: any) {
        console.error("Error deleting club:", err)
        setError(err.message || "Failed to delete club. Please try again.")
        setConfirmDeleteClub(false)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle removing a student from a subclub
  const handleRemoveStudentFromSubclub = async () => {
    if (!type || !selectedSubclub || !studentToRemove) return

    try {
      setLoading(true)
      setError(null)

      // Check if user is a coordinator
      if (user?.role !== "coordinator") {
        setError("Only coordinators can remove members from subclubs")
        setLoading(false)
        return
      }

      console.log(`Removing student ${studentToRemove.name} from subclub ${selectedSubclub.name}`)

      try {
        await clubsAPI.removeStudentFromSubclub(type, selectedSubclub.name, studentToRemove._id)
        console.log(`Student removed successfully from subclub`)

        // Update the members list
        setSubclubMembers((prevMembers) => prevMembers.filter((member) => member._id !== studentToRemove._id))

        // Reset the student to remove
        setStudentToRemove(null)
      } catch (err: any) {
        console.error("Error removing student from subclub:", err)
        setError(err.message || "Failed to remove student from subclub")
      }
    } finally {
      setLoading(false)
    }
  }

  // Get gradient colors based on club type
  const getGradientColors = () => {
    if (!type || !clubGradients[type as keyof typeof clubGradients]) {
      return clubGradients.technical.colors // Default to technical colors
    }
    return clubGradients[type as keyof typeof clubGradients].colors
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mr-4">
              <ClubIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>

          <div className="flex space-x-3">
            {/* Create Event Button - Only for coordinators */}
            {canCreateEvents && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 border-none shadow-md hover:shadow-lg transition-all duration-300">
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-title">Title</Label>
                      <Input
                        id="event-title"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-description">Description</Label>
                      <Textarea
                        id="event-description"
                        placeholder="Describe the event"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-date">Date</Label>
                      <Input
                        id="event-date"
                        type="datetime-local"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-location">Location (Optional)</Label>
                      <Input
                        id="event-location"
                        placeholder="Event Location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateEvent}
                      disabled={loading || !newEvent.title || !newEvent.description || !newEvent.date}
                      className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                    >
                      {loading ? "Creating..." : "Create Event"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Create Subclub Dialog - only visible if has permission */}
            {canCreateSubclubs && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 border-none shadow-md hover:shadow-lg transition-all duration-300">
                    <Layers className="mr-2 h-4 w-4" />
                    New Subclub
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle>Create New Subclub</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="subclub-name">Name</Label>
                      <Input
                        id="subclub-name"
                        placeholder="Subclub Name"
                        value={newSubclub.name}
                        onChange={(e) => setNewSubclub({ ...newSubclub, name: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subclub-description">Description</Label>
                      <Textarea
                        id="subclub-description"
                        placeholder="Describe the purpose of this subclub"
                        value={newSubclub.description}
                        onChange={(e) => setNewSubclub({ ...newSubclub, description: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateSubclub}
                      disabled={loading || !newSubclub.name}
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                    >
                      {loading ? "Creating..." : "Create Subclub"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Main content with tabs */}
        <Tabs defaultValue="subclubs" className="w-full">
          <TabsList className="mb-6 bg-gray-800 border-gray-700">
            <TabsTrigger
              value="subclubs"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-white"
            >
              Subclubs
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-white"
            >
              Events
            </TabsTrigger>
          </TabsList>

          {/* Subclubs Tab */}
          <TabsContent value="subclubs" className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Subclubs</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subclubs.length > 0 ? (
                subclubs.map((subclub, index) => {
                  const gradientColors = getGradientColors()
                  const colorIndex = index % gradientColors.length
                  const { color, hoverColor } = gradientColors[colorIndex]

                  return (
                    <Card
                      key={subclub.name}
                      className={`h-[280px] bg-gradient-to-br ${color} border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-gradient-to-br ${hoverColor} cursor-pointer overflow-hidden group`}
                      onClick={() => handleSelectSubclub(subclub)}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300 rounded-lg"></div>
                      <CardHeader className="flex flex-col items-center justify-center pt-8 pb-4 space-y-4">
                        <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300">
                          <ClubIcon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white text-center">{subclub.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center">
                        <p className="text-white/80 text-center mb-4">{subclub.description}</p>
                        <div className="flex items-center mt-2 bg-white/10 px-3 py-1 rounded-full">
                          <Users className="h-4 w-4 mr-2 text-white" />
                          <p className="text-white font-medium">{subclub.members?.length || 0} members</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <p className="text-gray-400 col-span-3 text-center py-8">No subclubs found.</p>
              )}
            </div>

            {/* Selected Subclub Details */}
            {selectedSubclub && (
              <Dialog open={!!selectedSubclub} onOpenChange={(open) => !open && setSelectedSubclub(null)}>
                <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <ClubIcon className="h-5 w-5 mr-2 text-purple-400" />
                      {selectedSubclub.name}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <p className="text-gray-300">{selectedSubclub.description}</p>

                    {/* Delete Subclub button - Only for coordinators */}
                    {user?.role === "coordinator" && (
                      <Button
                        className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 border-none shadow-md hover:shadow-lg transition-all duration-300 mb-3"
                        onClick={() => {
                          setSelectedSubclub(null) // Close current dialog
                          setSubclubToDelete(selectedSubclub) // Set subclub to delete
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Subclub
                      </Button>
                    )}

                    {/* Add Student to Subclub button - Only for coordinators */}
                    {canAddStudents && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Add Student to Subclub</h3>
                        <div className="space-y-4 bg-gray-700 p-4 rounded-md">
                          <div className="space-y-2">
                            <Label htmlFor="subclub-student-email">Student Email</Label>
                            <Input
                              id="subclub-student-email"
                              placeholder="student@example.com"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              className="bg-gray-800 border-gray-600"
                            />
                          </div>

                          {studentError && <p className="text-red-500 text-sm">{studentError}</p>}

                          <Button
                            onClick={handleAddStudentToClub}
                            disabled={addingStudent || !studentEmail}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 border-none"
                          >
                            {addingStudent ? "Adding Student..." : "Add Student to Subclub"}
                          </Button>
                        </div>
                      </div>
                    )}

                    <h3 className="text-lg font-semibold mt-4">Members</h3>

                    {loadingSubclub ? (
                      <p className="text-gray-400">Loading members...</p>
                    ) : subclubMembers.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {subclubMembers.map((member) => (
                          <div
                            key={member._id}
                            className="flex items-center justify-between p-2 hover:bg-gray-700 rounded"
                          >
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{member.name}</span>
                              <span className="ml-2 text-sm text-gray-400">{member.email}</span>
                            </div>
                            {/* Add remove button if user is coordinator */}
                            {user?.role === "coordinator" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-gray-800"
                                onClick={() => setStudentToRemove(member)}
                              >
                                <UserMinus className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No members have joined this subclub yet.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
            {loading ? (
              <p className="text-gray-400">Loading events...</p>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card
                    key={event._id}
                    className="bg-gradient-to-r  from-blue-400 to-blue-800 border-none shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{event.title}</h3>
                          <p className="text-gray-100 text-sm mt-1 mb-2">{event.description}</p>
                          <div className="flex items-center text-sm text-gray-100 mt-3">
                            <Calendar className="h-4 w-4 mr-1 text-purple-600" />
                            <span className="mr-4">{formatDate(event.date)}</span>
                            {event.location && (
                              <>
                                <MapPin className="h-4 w-4 mr-1 ml-2 text-purple-600" />
                                <span>{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Delete button - only visible for coordinators */}
                        {user?.role === "coordinator" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEventToDelete(event._id)
                            }}
                            className="text-red-600 hover:bg-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-200">No upcoming events.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Event Confirmation Dialog */}
      {eventToDelete && (
        <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              {error && <p className="text-red-500 text-sm mt-2 mb-2">{error}</p>}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEventToDelete(null)}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteEvent}
                  disabled={loading}
                  className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 border-none"
                >
                  {loading ? "Deleting..." : "Delete Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Subclub Confirmation Dialog */}
      {subclubToDelete && (
        <Dialog open={!!subclubToDelete} onOpenChange={(open) => !open && setSubclubToDelete(null)}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Confirm Subclub Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-red-500 font-semibold mb-2">Warning: This action cannot be undone!</p>
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete the subclub "{subclubToDelete.name}"? This will remove all members from
                the subclub.
              </p>
              {error && <p className="text-red-500 text-sm mt-2 mb-2">{error}</p>}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSubclubToDelete(null)}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteSubclub}
                  disabled={loading}
                  className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 border-none"
                >
                  {loading ? "Deleting..." : "Delete Subclub"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add confirmation dialog for removing student */}
      {studentToRemove && (
        <Dialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-300">
                Are you sure you want to remove <span className="font-semibold">{studentToRemove.name}</span> from the
                subclub?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStudentToRemove(null)}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveStudentFromSubclub}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 border-none"
              >
                {loading ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}


    </div>
  )
}

export default ClubDetails
