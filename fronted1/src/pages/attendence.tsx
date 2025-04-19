"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, CheckCircle, XCircle, AlertCircle, ChevronDown, Calendar, Clock, Info } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { attendanceAPI } from "@/lib/api"

interface Subject {
  _id: string
  name: string
  student: string
  createdAt: string
}

interface AttendanceRecord {
  _id: string
  subject: string
  student: string
  date: string
  status: "Present" | "Absent"
  createdAt: string
}

interface SubjectWithAttendance {
  subject: Subject
  records: AttendanceRecord[]
  percentage: number
  isLoading: boolean
  lastMarked: "Present" | "Absent" | null
}

// Add a function to format dates nicely
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  return new Date(dateString).toLocaleDateString("en-US", options)
}

// Calculate current streak of consecutive days with present status
const calculateCurrentStreak = (records: AttendanceRecord[]): number => {
  if (records.length === 0) return 0

  // Sort records by date (newest first)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let streak = 0
  let lastDate: Date | null = null

  for (const record of sortedRecords) {
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)

    // If not present, break the streak
    if (record.status !== "Present") break

    // If this is the first record
    if (lastDate === null) {
      streak = 1
      lastDate = recordDate
      continue
    }

    // Check if consecutive day (1 day difference)
    const daysDifference = Math.round((lastDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDifference === 1) {
      streak++
      lastDate = recordDate
    } else {
      // Not consecutive, break the streak
      break
    }
  }

  return streak
}

// Calculate best streak of consecutive present days
const calculateBestStreak = (records: AttendanceRecord[]): number => {
  if (records.length === 0) return 0

  // Sort records by date (oldest first)
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let currentStreak = 0
  let bestStreak = 0
  let lastDate: Date | null = null

  for (const record of sortedRecords) {
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)

    // If present
    if (record.status === "Present") {
      // If first record or not consecutive with last date
      if (lastDate === null) {
        currentStreak = 1
      } else {
        // Check if consecutive day
        const daysDifference = Math.round((recordDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDifference === 1) {
          currentStreak++
        } else {
          // Gap in dates, reset streak
          currentStreak = 1
        }
      }

      // Update best streak if current is better
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      // Absent, reset streak
      currentStreak = 0
    }

    lastDate = recordDate
  }

  return bestStreak
}

// Calculate attendance for the current month
const calculateMonthAttendance = (records: AttendanceRecord[]): { present: number; total: number } => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Filter records for current month
  const monthRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
  })

  // Count present days
  const presentDays = monthRecords.filter((record) => record.status === "Present").length

  return {
    present: presentDays,
    total: monthRecords.length,
  }
}

// Generate calendar data for the last 30 days
interface CalendarDay {
  date: string | null
  status: "Present" | "Absent" | "None"
}

const generateLast30DaysAttendance = (records: AttendanceRecord[]): CalendarDay[] => {
  const result: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Create a map of dates to status for quick lookup
  const dateStatusMap = new Map<string, "Present" | "Absent">()
  records.forEach((record) => {
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)
    const dateKey = recordDate.toISOString().split("T")[0]
    dateStatusMap.set(dateKey, record.status as "Present" | "Absent")
  })

  // Generate the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateKey = date.toISOString().split("T")[0]

    if (dateStatusMap.has(dateKey)) {
      result.push({
        date: date.toISOString(),
        status: dateStatusMap.get(dateKey)!,
      })
    } else {
      result.push({
        date: date.toISOString(),
        status: "None",
      })
    }
  }

  return result
}

// Calculate attendance for a specific period (last X days)
const calculatePeriodAttendance = (records: AttendanceRecord[], days: number): { present: number; total: number } => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const startDate = new Date(now)
  startDate.setDate(now.getDate() - days)

  // Filter records for the specified period
  const periodRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)
    return recordDate >= startDate && recordDate <= now
  })

  // Count present days
  const presentDays = periodRecords.filter((record) => record.status === "Present").length

  return {
    present: presentDays,
    total: periodRecords.length,
  }
}

// Get the days of the current week for the weekly progress tracker
interface WeekDay {
  label: string
  date: Date
}

const getCurrentWeekDays = (): WeekDay[] => {
  const days: WeekDay[] = []
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get current date
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // Find the Sunday of the current week
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - dayOfWeek)

  // Create an array of the 7 days in the current week
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)

    days.push({
      label: dayLabels[i],
      date,
    })
  }

  return days
}

// Calculate projected attendance percentage based on current patterns
const calculateProjectedAttendance = (records: AttendanceRecord[]): number => {
  if (records.length === 0) return 0

  // Calculate current percentage
  const presentCount = records.filter((r) => r.status === "Present").length
  const totalCount = records.length
  const currentPercentage = (presentCount / totalCount) * 100

  // If we have less than 5 records, just return the current percentage
  if (totalCount < 5) return Math.round(currentPercentage)

  // Look at the trend in the last 5 records to project future attendance
  const recentRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const recentPresentCount = recentRecords.filter((r) => r.status === "Present").length
  const recentPercentage = (recentPresentCount / 5) * 100

  // Weight the projection: 70% based on recent trend, 30% on overall history
  const projectedPercentage = recentPercentage * 0.7 + currentPercentage * 0.3

  return Math.round(projectedPercentage)
}

// Calculate how many more present days needed to reach 75% attendance
const calculateAttendanceNeeded = (records: AttendanceRecord[]): number => {
  if (records.length === 0) return 0

  const presentCount = records.filter((r) => r.status === "Present").length
  const totalCount = records.length
  const currentPercentage = (presentCount / totalCount) * 100

  // Already at or above 75%
  if (currentPercentage >= 75) return 0

  // Calculate how many consecutive present days needed to reach 75%
  // Formula: (0.75 * (totalCount + x) - presentCount) = x
  // Solving for x: x = (0.75 * totalCount - presentCount) / 0.25
  const daysNeeded = Math.ceil((0.75 * totalCount - presentCount) / 0.25)

  return daysNeeded
}

const Attendance = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectsWithAttendance, setSubjectsWithAttendance] = useState<SubjectWithAttendance[]>([])
  const [newSubject, setNewSubject] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subjects and attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Get all subjects
        const subjectsResponse = await attendanceAPI.getSubjects()
        // Handle both response formats
        const subjectsData = subjectsResponse.data ? subjectsResponse.data : subjectsResponse
        setSubjects(subjectsData)

        // Get attendance records for each subject
        const subjectsWithRecords: SubjectWithAttendance[] = []

        for (const subject of subjectsData) {
          const recordsResponse = await attendanceAPI.getAttendanceRecords(subject._id)
          const records = recordsResponse.data ? recordsResponse.data : recordsResponse

          const percentageResponse = await attendanceAPI.getAttendancePercentage(subject._id)
          const percentage =
            percentageResponse.percentage || (percentageResponse.data ? percentageResponse.data.percentage : 0)

          subjectsWithRecords.push({
            subject,
            records,
            percentage,
            isLoading: false,
            lastMarked: null,
          })
        }

        setSubjectsWithAttendance(subjectsWithRecords)
      } catch (err) {
        console.error("Error fetching attendance data:", err)
        setError("Failed to load attendance data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddSubject = async () => {
    if (newSubject.trim() === "") return

    try {
      setError(null)
      const response = await attendanceAPI.createSubject(newSubject)

      // Add the new subject to state
      const newSubjectData = {
        _id: response._id || (response.data && response.data._id),
        name: response.name || (response.data && response.data.name),
        student: response.student || (response.data && response.data.student),
        createdAt: response.createdAt || (response.data && response.data.createdAt),
      }

      setSubjects([...subjects, newSubjectData])
      setSubjectsWithAttendance([
        ...subjectsWithAttendance,
        {
          subject: newSubjectData,
          records: [],
          percentage: 0,
          isLoading: false,
          lastMarked: null,
        },
      ])

      setNewSubject("")
    } catch (err: any) {
      console.error("Error adding subject:", err)
      setError(err.message || "Failed to add subject")
    }
  }

  const handleDeleteSubject = async (id: string) => {
    try {
      await attendanceAPI.deleteSubject(id)

      // Remove the subject from state
      setSubjects(subjects.filter((s) => s._id !== id))
      setSubjectsWithAttendance(subjectsWithAttendance.filter((s) => s.subject._id !== id))
    } catch (err) {
      console.error("Error deleting subject:", err)
      setError("Failed to delete subject")
    }
  }

  const handleMarkAttendance = async (subjectId: string, status: "Present" | "Absent") => {
    try {
      setError(null)

      // Show loading state
      setSubjectsWithAttendance((prev) => {
        return prev.map((item) => {
          if (item.subject._id === subjectId) {
            return {
              ...item,
              isLoading: true,
            }
          }
          return item
        })
      })

      // Mark attendance for today
      const responseData = await attendanceAPI.markAttendance(subjectId, status)
      // Handle both response formats
      const response = responseData.data ? responseData.data : responseData

      // Update state with the new attendance record
      setSubjectsWithAttendance((prev) => {
        return prev.map((item) => {
          if (item.subject._id === subjectId) {
            // Check if this record already exists for today (by date)
            const today = new Date().setHours(0, 0, 0, 0)
            const existingRecordIndex = item.records.findIndex((record) => {
              const recordDate = new Date(record.date).setHours(0, 0, 0, 0)
              return recordDate === today
            })

            let updatedRecords
            if (existingRecordIndex !== -1) {
              // Update existing record
              updatedRecords = [...item.records]
              updatedRecords[existingRecordIndex] = response
            } else {
              // Add new record
              updatedRecords = [...item.records, response]
            }

            // Recalculate percentage
            const presentCount = updatedRecords.filter((r) => r.status === "Present").length
            const totalCount = updatedRecords.length
            const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

            return {
              ...item,
              records: updatedRecords,
              percentage,
              isLoading: false,
              lastMarked: status, // Track last marked status for UI feedback
            }
          }
          return item
        })
      })
    } catch (err: any) {
      console.error("Error marking attendance:", err)
      setError(err.message || "Failed to mark attendance")

      // Reset loading state
      setSubjectsWithAttendance((prev) => {
        return prev.map((item) => {
          if (item.subject._id === subjectId) {
            return {
              ...item,
              isLoading: false,
            }
          }
          return item
        })
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Attendance Records</h1>

        <Card className="bg-[#1E293B] border-[#334155] mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Add New Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter subject name"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="bg-[#0F172A] border-[#334155] text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                onClick={handleAddSubject}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4 text-white">Your Attendance Records</h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-300">Loading attendance data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-300">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : subjectsWithAttendance.length === 0 ? (
          <p className="text-gray-300">No attendance records added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectsWithAttendance.map((item) => (
              <Card
                key={item.subject._id}
                className="bg-[#1E293B] border-[#334155] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.subject.name}</h3>
                      <p className="text-gray-300 mt-1">
                        {item.records.length > 0
                          ? `Last updated: ${new Date(item.records[0].date).toLocaleDateString()}`
                          : "No attendance records yet"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAttendance(item.subject._id, "Present")}
                        disabled={item.isLoading}
                        className={`${
                          item.lastMarked === "Present"
                            ? "bg-green-900/30 text-green-300 border-green-300 font-medium"
                            : "text-green-800 border-green-500 hover:bg-green-900/30 font-medium"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {item.isLoading ? "Saving..." : "Present"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAttendance(item.subject._id, "Absent")}
                        disabled={item.isLoading}
                        className={`${
                          item.lastMarked === "Absent"
                            ? "bg-red-900/30 text-red-300 border-red-300 font-medium"
                            : "text-red-600 border-red-400 hover:bg-red-900/30 font-medium"
                        }`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {item.isLoading ? "Saving..." : "Absent"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubject(item.subject._id)}
                        disabled={item.isLoading}
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 bg-[#0F172A] p-3 rounded-md shadow-inner">
                    <div className="text-center p-2">
                      <p className="text-gray-300 text-xs uppercase">Total Classes</p>
                      <p className="text-xl font-bold mt-1 text-white">{item.records.length}</p>
                      <p className="text-xs text-gray-400 mt-1">All time</p>
                    </div>
                    <div className="text-center p-2">
                      <p className="text-gray-300 text-xs uppercase">Present</p>
                      <p className="text-xl font-bold mt-1 text-green-400">
                        {item.records.filter((r) => r.status === "Present").length}
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        {Math.round(
                          (item.records.filter((r) => r.status === "Present").length /
                            Math.max(item.records.length, 1)) *
                            100,
                        )}
                        % of total
                      </p>
                    </div>
                    <div className="text-center p-2">
                      <p className="text-gray-300 text-xs uppercase">Absent</p>
                      <p className="text-xl font-bold mt-1 text-red-400">
                        {item.records.filter((r) => r.status === "Absent").length}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        {Math.round(
                          (item.records.filter((r) => r.status === "Absent").length /
                            Math.max(item.records.length, 1)) *
                            100,
                        )}
                        % of total
                      </p>
                    </div>
                  </div>

                  {/* Weekly attendance tracker */}
                  <div className="bg-[#0F172A] p-3 rounded-md mb-4 shadow-inner">
                    <h4 className="text-sm font-medium mb-2 text-white">This Week's Progress</h4>
                    <div className="flex justify-between">
                      {getCurrentWeekDays().map((day, index) => {
                        const dayRecord = item.records.find((record) => {
                          const recordDate = new Date(record.date)
                          return recordDate.toDateString() === day.date.toDateString()
                        })

                        const isToday = day.date.toDateString() === new Date().toDateString()
                        const isPast = day.date < new Date()

                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div className="text-xs text-gray-300 mb-1">{day.label}</div>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium 
                                                            ${isToday ? "ring-2 ring-blue-400" : ""}
                                                            ${
                                                              dayRecord?.status === "Present"
                                                                ? "bg-green-900/50 text-green-300"
                                                                : dayRecord?.status === "Absent"
                                                                  ? "bg-red-900/50 text-red-300"
                                                                  : isPast
                                                                    ? "bg-yellow-900/30 text-yellow-300"
                                                                    : "bg-[#1E293B] text-gray-400"
                                                            }`}
                            >
                              {day.date.getDate()}
                            </div>
                            <div className="text-xs mt-1">
                              {dayRecord?.status === "Present"
                                ? "✓"
                                : dayRecord?.status === "Absent"
                                  ? "✗"
                                  : isPast
                                    ? "!"
                                    : ""}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Add attendance streak information */}
                  <div className="bg-[#0F172A] p-3 rounded-md mb-4 shadow-inner">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-300 text-xs uppercase">Current Streak</p>
                        {item.records.length > 0 ? (
                          <p className="text-lg font-bold mt-1 text-white">
                            {calculateCurrentStreak(item.records)} day
                            {calculateCurrentStreak(item.records) !== 1 ? "s" : ""}
                          </p>
                        ) : (
                          <p className="text-lg font-bold mt-1 text-white">0 days</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-300 text-xs uppercase">Best Streak</p>
                        {item.records.length > 0 ? (
                          <p className="text-lg font-bold mt-1 text-white">
                            {calculateBestStreak(item.records)} day{calculateBestStreak(item.records) !== 1 ? "s" : ""}
                          </p>
                        ) : (
                          <p className="text-lg font-bold mt-1 text-white">0 days</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-300 text-xs uppercase">This Month</p>
                        <p className="text-lg font-bold mt-1 text-white">
                          {calculateMonthAttendance(item.records).present}/
                          {calculateMonthAttendance(item.records).total} days
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance forecast and goals */}
                  <div className="bg-[#0F172A] p-3 rounded-md mb-4 shadow-inner">
                    <h4 className="text-sm font-medium mb-2 text-white">Forecast & Goals</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1E293B] rounded-md p-3 shadow">
                        <p className="text-gray-300 text-xs uppercase mb-1">Projected Attendance</p>
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-medium text-white">{calculateProjectedAttendance(item.records)}%</p>
                          <div
                            className={`px-2 py-1 rounded text-xs ${
                              calculateProjectedAttendance(item.records) >= 75
                                ? "bg-green-900/30 text-green-300"
                                : "bg-red-900/30 text-red-300"
                            }`}
                          >
                            {calculateProjectedAttendance(item.records) >= 75 ? "On Track" : "Needs Improvement"}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Based on your current attendance pattern</p>
                      </div>
                      <div className="bg-[#1E293B] rounded-md p-3 shadow">
                        <p className="text-gray-300 text-xs uppercase mb-1">To Reach 75% Minimum</p>
                        {calculateAttendanceNeeded(item.records) > 0 ? (
                          <>
                            <p className="text-lg font-medium text-white">
                              Need {calculateAttendanceNeeded(item.records)} more days
                            </p>
                            <p className="text-xs text-gray-400 mt-2">To achieve minimum required attendance</p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-medium text-green-300">Goal Achieved!</p>
                            <p className="text-xs text-gray-400 mt-2">You've met the minimum attendance requirement</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Attendance Percentage</span>
                      <span className="text-sm font-medium text-white">{item.percentage}%</span>
                    </div>
                    <Progress
                      value={item.percentage}
                      className="h-3 bg-[#334155]"
                      style={{
                        background: "#334155",
                        position: "relative",
                      }}
                    >
                      <div
                        className={`absolute h-full transition-all rounded-md ${
                          item.percentage >= 75
                            ? "bg-green-500"
                            : item.percentage >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </Progress>
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-sm ${item.percentage >= 75 ? "text-green-300" : "text-red-300"}`}>
                        {item.percentage >= 75
                          ? "Good Standing"
                          : item.percentage >= 65
                            ? "At Risk - Attendance Below 75%"
                            : "Critical - Attendance Below Required Minimum"}
                      </p>
                      {item.percentage < 75 && (
                        <p className="text-xs text-yellow-300">
                          Need{" "}
                          {Math.ceil(
                            (75 * item.records.length -
                              item.records.filter((r) => r.status === "Present").length * 100) /
                              25,
                          )}
                          more present days to reach 75%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attendance History Collapsible */}
                  {item.records.length > 0 && (
                    <Collapsible className="mt-4 border-t border-[#334155] pt-4">
                      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm text-gray-300 hover:text-white">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Attendance History
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        {/* Calendar visualization */}
                        <div className="mb-3 p-3 bg-[#0F172A] rounded-md shadow-inner">
                          <h4 className="text-sm font-medium mb-2 text-white">Last 30 Days</h4>
                          <div className="flex flex-wrap gap-1">
                            {generateLast30DaysAttendance(item.records).map((day, index) => (
                              <div
                                key={index}
                                className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-medium ${
                                  day.status === "Present"
                                    ? "bg-green-900/50 text-green-300"
                                    : day.status === "Absent"
                                      ? "bg-red-900/50 text-red-300"
                                      : "bg-[#1E293B] text-gray-400"
                                }`}
                                title={
                                  day.date ? `${new Date(day.date).toLocaleDateString()}: ${day.status}` : "No record"
                                }
                              >
                                {day.date ? new Date(day.date).getDate() : ""}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Attendance statistics */}
                        <div className="mb-3 p-3 bg-[#0F172A] rounded-md shadow-inner">
                          <h4 className="text-sm font-medium mb-2 text-white">Statistics</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-xs text-gray-300">Last Week</p>
                              <p className="text-sm font-medium text-white">
                                {calculatePeriodAttendance(item.records, 7).present}/
                                {calculatePeriodAttendance(item.records, 7).total} days
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-300">Last 30 Days</p>
                              <p className="text-sm font-medium text-white">
                                {calculatePeriodAttendance(item.records, 30).present}/
                                {calculatePeriodAttendance(item.records, 30).total} days
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-300">Attendance Rate</p>
                              <p className="text-sm font-medium text-white">
                                {item.records.length > 0
                                  ? Math.round(
                                      (item.records.filter((r) => r.status === "Present").length /
                                        item.records.length) *
                                        100,
                                    )
                                  : 0}
                                %
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto pr-2 space-y-1">
                          {item.records
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((record) => (
                              <div
                                key={record._id}
                                className={`flex justify-between items-center py-2 px-3 rounded-md ${
                                  record.status === "Present" ? "bg-green-900/30" : "bg-red-900/30"
                                }`}
                              >
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-2 text-gray-300" />
                                  <p className="text-sm text-white">{formatDate(record.date)}</p>
                                </div>
                                <div
                                  className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    record.status === "Present"
                                      ? "bg-green-900/50 text-green-300"
                                      : "bg-red-900/50 text-red-300"
                                  }`}
                                >
                                  {record.status === "Present" ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {record.status}
                                </div>
                              </div>
                            ))}
                        </div>
                        {item.records.length > 0 && (
                          <div className="flex items-center mt-2 p-2 bg-blue-900/30 rounded-md shadow">
                            <Info className="h-4 w-4 text-blue-300 mr-2" />
                            <p className="text-xs text-blue-300">
                              Records are saved automatically. You can mark attendance once per day.
                            </p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Attendance
