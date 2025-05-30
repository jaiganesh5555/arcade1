"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import {
  Camera,
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Eye,
  Share2,
  ChevronDown,
  BarChart3,
  Users,
  Gamepad,
  LogOut,
  Grid,
  List,
} from "lucide-react"
import axios from "axios"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface DemoData {
  id: string
  title: string
  description: string
  type: string
  content: string
  thumbnail?: string
  views: number
  createdAt: string
  updatedAt: string
  userId: string
  user: {
    id: string
    email: string
    name?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [demos, setDemos] = useState<DemoData[]>([])
  const [loadingDemos, setLoadingDemos] = useState(true)
  const [errorLoadingDemos, setErrorLoadingDemos] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [viewType, setViewType] = useState<"grid" | "list">("grid")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchDemos = async () => {
      if (typeof window === "undefined") return

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        setErrorLoadingDemos("Authentication token not found. Please log in.")
        setLoadingDemos(false)
        return
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        }

        // Fetch from API
        const response = await axios.get("http://localhost:3002/api/demos", {
          headers,
        })
        console.log("Demos fetched successfully:", response.data)

        // Also get local demos
        const localDemos = JSON.parse(localStorage.getItem("localDemos") || "[]")

        // Combine API demos with local demos
        const allDemos = [...(response.data as DemoData[]), ...localDemos]
        setDemos(allDemos)
      } catch (error: any) {
        console.error("Error fetching demos:", error)

        // If API fails, still show local demos
        const localDemos = JSON.parse(localStorage.getItem("localDemos") || "[]")
        setDemos(localDemos)

        if (localDemos.length === 0) {
          setErrorLoadingDemos(error.response?.data?.message || "Failed to load demos.")
        }
      } finally {
        setLoadingDemos(false)
      }
    }

    fetchDemos()
  }, [])

  const filteredDemos = demos.filter(
    (demo) =>
      (demo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demo.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeFilter === "all" || demo.type === activeFilter),
  )

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (loadingDemos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="text-primary"
        >
          <Gamepad className="w-8 h-8" />
        </motion.div>
      </div>
    )
  }

  if (errorLoadingDemos && demos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{errorLoadingDemos}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-background border-r flex-col">
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="w-6 h-6 bg-orange-500 rounded-sm flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <span className="font-medium">Ganesh Jai's workspace</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => router.push("/create-demo")}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/insights")}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Insights
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">⌘K</kbd>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">Just me</div>
            <Button variant="secondary" className="w-full justify-start">
              <Gamepad className="w-4 h-4 mr-2" />
              Arcades
            </Button>
            <Link href="/insights">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Insights
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Shared with me
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">My Arcades</h1>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/create-demo">
                <Button className="bg-blue-600 hover:bg-blue-700">Create new</Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-background">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "interactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("interactive")}
              >
                Arcades
              </Button>
              <Button
                variant={activeFilter === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("video")}
              >
                Collections
              </Button>
              <Button variant="outline" size="sm">
                Status <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" size="sm">
                Tags <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Last edited <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-none ${viewType === "grid" ? "bg-accent" : ""}`}
                  onClick={() => setViewType("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-none ${viewType === "list" ? "bg-accent" : ""}`}
                  onClick={() => setViewType("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {filteredDemos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center max-w-md">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gamepad className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {searchQuery || activeFilter !== "all"
                      ? "No matching arcades found"
                      : "Let's create your first Arcade!"}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || activeFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "Your first step is to install our Chrome Extension to make it easy to record demos and capture screenshots of your product."}
                  </p>
                </motion.div>

                {!searchQuery && activeFilter === "all" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                      <Camera className="w-4 h-4 mr-2" />
                      Install extension
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className={`grid gap-6 ${
                viewType === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              <AnimatePresence>
                {filteredDemos.map((demo) => (
                  <motion.div
                    key={demo.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group"
                  >
                    <Link href={`/dashboard/demos/${demo.id}`} passHref>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          <motion.div
                            className="w-full h-full relative"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Image
                              src={demo.thumbnail || "/placeholder.svg?height=200&width=350"}
                              alt={demo.title}
                              fill
                              className="object-cover"
                            />
                          </motion.div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button size="sm" variant="secondary" className="rounded-full">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="rounded-full">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <motion.h3
                              className="font-semibold text-foreground line-clamp-2"
                              whileHover={{ scale: 1.01 }}
                            >
                              {demo.title}
                            </motion.h3>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <Badge variant="outline">Private</Badge>
                            <span>{new Date(demo.updatedAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              <span>{demo.views.toLocaleString()}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
