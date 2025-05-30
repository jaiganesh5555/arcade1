"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Menu,
  Plus,
  Play,
  MoreHorizontal,
  Undo,
  Redo,
  Copy,
  Code,
  Download,
  Volume2,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react"
import axios from "axios"
import { format } from "date-fns"

export default function CreateDemoPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("edit")
  const [selectedStep, setSelectedStep] = useState(0)
  const [demoTitle, setDemoTitle] = useState("Arcade Flow")
  const [selectedTheme, setSelectedTheme] = useState("ganesh")
  const [selectedWrapper, setSelectedWrapper] = useState("rounded")
  const [backgroundColor, setBackgroundColor] = useState("#3b82f6")
  const [cursorStyle, setCursorStyle] = useState("pointer")
  const [watermarkEnabled, setWatermarkEnabled] = useState(true)
  const [selectedFont, setSelectedFont] = useState("Inter")
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareTitle, setShareTitle] = useState("")
  const [shareDescription, setShareDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sample steps/slides
  const [steps, setSteps] = useState([
    {
      id: 1,
      thumbnail: "/placeholder.svg?height=120&width=200",
      image: "/placeholder.svg?height=400&width=600",
      title: "Step 1",
    },
  ])

  const backgroundColors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#6366f1",
  ]

  const wrapperStyles = [
    { id: "none", name: "None", preview: "⬜" },
    { id: "rounded", name: "Rounded", preview: "⬜" },
    { id: "shadow", name: "Shadow", preview: "⬜" },
  ]

  const cursorStyles = [
    { id: "pointer", name: "Pointer", icon: "👆" },
    { id: "hand", name: "Hand", icon: "✋" },
    { id: "arrow", name: "Arrow", icon: "➡️" },
  ]

  const addNewStep = () => {
    const newStep = {
      id: steps.length + 1,
      thumbnail: "/placeholder.svg?height=120&width=200",
      image: "/placeholder.svg?height=400&width=600",
      title: `Step ${steps.length + 1}`,
    }
    setSteps([...steps, newStep])
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return // Do nothing if no file is selected
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        // Optionally show an error message to the user
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type for FormData, axios handles it automatically
      }

      // Send the image file to the backend upload endpoint
      const uploadResponse = await axios.post("http://localhost:3002/api/upload-image", formData, {
        headers,
      });

      const imageUrl = uploadResponse.data.url; // Get the URL from the backend response

      // Update the steps state with the new image URL
      setSteps(currentSteps => {
        const updatedSteps = [...currentSteps];
        const currentStep = updatedSteps[selectedStep];
        if (currentStep) {
          updatedSteps[selectedStep] = {
            ...currentStep,
            image: imageUrl,
            thumbnail: imageUrl, // Use the same URL for thumbnail for now
          };
        } else {
          console.error("Could not find step at index", selectedStep);
        }
        return updatedSteps;
      });

      console.log('Image uploaded and step updated with URL:', imageUrl);

    } catch (error) {
      console.error('Failed to upload image:', error);
      // Optionally show an error message to the user
    }
  }

  const handleShare = async () => {
    if (!shareTitle.trim()) return

    // Construct the demo data object
    const newDemo = {
      title: shareTitle,
      description: shareDescription,
      isPublic: isPublic,
      type: "interactive", // Assuming interactive for now
      content: JSON.stringify(steps.map(step => {
        const { image, thumbnail, ...rest } = step;
        return rest;
      })),
      thumbnail: steps[0]?.image || "/placeholder.svg?height=200&width=350",
      // url will be added by the backend if uploaded to R2
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        // Optionally show an error message to the user
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.post("http://localhost:3002/api/demos", newDemo, {
        headers,
      })

      console.log("Demo shared successfully:", response.data)
      setShowShareDialog(false)
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to share demo:", error)
      // Optionally show an error message to the user
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Just me</span>
              <span>/</span>
              <span className="text-foreground font-medium">
                {demoTitle} {isClient ? `(${format(new Date(), 'MM/dd/yyyy')})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button variant={activeTab === "edit" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("edit")}>
              Edit
            </Button>
            <Button
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("preview")
                setIsPreviewMode(true)
              }}
            >
              Preview
            </Button>
            <Button variant="ghost" size="sm">
              Insights
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-600">
              🔄 Upgrade
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">Share</Button>
              </DialogTrigger>
              <DialogContent aria-describedby="share-dialog-description">
                <DialogHeader>
                  <DialogTitle>Share Your Demo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="share-title">Title</Label>
                    <Input
                      id="share-title"
                      placeholder="Enter demo title..."
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="share-description">Description</Label>
                    <Textarea
                      id="share-description"
                      placeholder="Describe your demo..."
                      value={shareDescription}
                      onChange={(e) => setShareDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  {/* Privacy Setting */}
                  <div>
                    <Label htmlFor="privacy">Privacy</Label>
                    <Select value={isPublic ? "public" : "private"} onValueChange={(value) => setIsPublic(value === "public")}>
                      <SelectTrigger id="privacy">
                        <SelectValue placeholder="Select privacy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleShare} disabled={!shareTitle.trim()}>
                      Share Demo
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-background px-4 py-2">
        <div className="flex items-center justify-center space-x-2">
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Redo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Code className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Volume2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar - Steps */}
        <div className="w-64 border-r bg-background p-4 overflow-y-auto">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                whileHover={{ scale: 1.02 }}
                className={`relative cursor-pointer rounded-lg border-2 overflow-hidden ${
                  selectedStep === index ? "border-blue-500" : "border-gray-200"
                }`}
                onClick={() => setSelectedStep(index)}
              >
                <img src={step.thumbnail || "/placeholder.svg"} alt={step.title} className="w-full h-24 object-cover" />
                <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="absolute bottom-2 right-2">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
            <Button variant="outline" className="w-full h-24 border-dashed" onClick={addNewStep}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>

          <div className="mt-4">
            <Button variant="outline" className="w-full">
              <ChevronDown className="w-4 h-4 mr-2" />
              Add step
            </Button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-50 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {isPreviewMode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="aspect-video relative">
                  <img
                    src={steps[selectedStep]?.image || "/placeholder.svg"}
                    alt="Demo preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Play className="w-6 h-6 mr-2" />
                      Play Demo
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
                <div
                  className={`relative bg-white rounded-lg overflow-hidden ${
                    selectedWrapper === "shadow" ? "shadow-2xl" : ""
                  } ${selectedWrapper === "rounded" ? "rounded-xl" : ""}`}
                  style={{ backgroundColor: selectedWrapper === "none" ? backgroundColor : "white" }}
                >
                  <div className="aspect-video relative">
                    <img
                      src={steps[selectedStep]?.image || "/placeholder.svg"}
                      alt="Current step"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <div className="absolute bottom-4 right-4">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  {watermarkEnabled && (
                    <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
                      Made with Arcade
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Design Controls */}
        <div className="w-80 border-l bg-background p-4 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Design</h3>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Theme */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganesh">Ganesh...</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wrapper */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Wrapper</Label>
              <div className="grid grid-cols-3 gap-2">
                {wrapperStyles.map((style) => (
                  <Button
                    key={style.id}
                    variant={selectedWrapper === style.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWrapper(style.id)}
                    className="h-12"
                  >
                    {style.preview}
                  </Button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Background</Label>
              <div className="grid grid-cols-5 gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      backgroundColor === color ? "border-gray-900" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
                <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Cursor */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Cursor</Label>
              <div className="grid grid-cols-3 gap-2">
                {cursorStyles.map((style) => (
                  <Button
                    key={style.id}
                    variant={cursorStyle === style.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCursorStyle(style.id)}
                    className="h-12"
                  >
                    {style.icon}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-2 text-sm">
                Preview <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Watermark */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Watermark</Label>
              <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
            </div>

            {/* Font */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Font</Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Metadata
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between">
                <span>Audio</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between">
                <span>Other</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
