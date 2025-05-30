"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Play, ArrowRight, Sparkles } from 'lucide-react'

const slides = [
  {
    id: 1,
    title: "Dashboard Overview",
    content: "Get a complete view of your business metrics and performance indicators in one centralized dashboard.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 2,
    title: "Analytics & Reports",
    content: "Deep dive into your data with comprehensive analytics and automated reporting features.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 3,
    title: "Team Collaboration",
    content: "Work seamlessly with your team using our built-in collaboration tools and real-time updates.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 4,
    title: "Integrations",
    content: "Connect with your favorite tools and streamline your workflow with powerful integrations.",
    image: "/placeholder.svg?height=400&width=600",
  },
]

function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return undefined

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-foreground">ARCADE</span>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <button className="text-muted-foreground hover:text-foreground font-medium">Product</button>
                <button className="text-muted-foreground hover:text-foreground font-medium">Solutions</button>
                <button className="text-muted-foreground hover:text-foreground font-medium">Resources</button>
                <button className="text-muted-foreground hover:text-foreground font-medium">Company</button>
                <button className="text-muted-foreground hover:text-foreground font-medium">Pricing</button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up for free</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Announcement Banner */}
          <div className="inline-flex items-center mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Announcing AI-Powered Content Generation
              <Link href="/insights" className="ml-2 text-primary font-medium cursor-pointer hover:underline">Learn more →</Link>
            </Badge>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Product demos that
            <br />
            <span className="text-primary">aren't boring</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create interactive demos that convert — in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-3">
                Get started for free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3">
              Talk to sales
            </Button>
          </div>
        </div>

        {/* Interactive Demo/Slideshow */}
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Browser Frame */}
            <div className="bg-muted rounded-t-xl p-4 border border-border">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="flex-1 bg-background rounded mx-4 px-3 py-1">
                  <span className="text-sm text-muted-foreground">arcade.software/demo</span>
                </div>
              </div>
            </div>

            {/* Slideshow Content */}
            <div className="bg-background border-x border-b border-border rounded-b-xl overflow-hidden">
              <div className="relative h-96 md:h-[500px]">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                      <div className="text-center p-8">
                        <div className="w-32 h-32 bg-primary/10 rounded-lg mx-auto mb-6 flex items-center justify-center">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-4">{slide.title}</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">{slide.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Navigation Controls */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>

                {/* Play/Pause Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute bottom-4 right-4 bg-background/80 hover:bg-background rounded-full p-2 shadow-lg transition-all"
                >
                  <Play className={`w-4 h-4 text-foreground ${isPlaying ? "opacity-50" : "opacity-100"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage
