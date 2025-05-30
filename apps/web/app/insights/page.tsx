"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, TrendingUp, TrendingDown, Eye, MousePointer, Clock, Download } from "lucide-react"
import Link from "next/link"

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState("7days")
  const [showInternal, setShowInternal] = useState(true)

  const metrics = [
    {
      title: "Views",
      value: "2,206",
      change: "+16%",
      trend: "up",
      icon: Eye,
    },
    {
      title: "Completions",
      value: "19%",
      subtitle: "419",
      change: "-7%",
      trend: "down",
      icon: TrendingUp,
    },
    {
      title: "CTA Clicks",
      value: "7%",
      subtitle: "154",
      change: "+2%",
      trend: "up",
      icon: MousePointer,
    },
    {
      title: "Play Time",
      value: "1m 4s",
      change: "+2%",
      trend: "up",
      icon: Clock,
    },
  ]

  const arcadeData = [
    {
      name: "Digital Odyssey",
      players: 0,
      completionRate: "19%",
      ctaClickRate: "13%",
      trends: { players: "0%", completion: "0%", cta: "+12%" },
    },
    {
      name: "Interactive Journey",
      players: 0,
      completionRate: "13%",
      ctaClickRate: "9%",
      trends: { players: "0%", completion: "-12%", cta: "+2%" },
    },
    {
      name: "Visionary Nexus",
      players: 0,
      completionRate: "10%",
      ctaClickRate: "8%",
      trends: { players: "0%", completion: "+24%", cta: "-6%" },
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Insights</h1>
              <p className="text-muted-foreground">Analytics for your arcades</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </motion.div>

        {/* Notice */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Don't worry, this isn't your data</h3>
                  <p className="text-blue-700 text-sm">
                    Play with our sample dataset to explore how Insights look and feel. Upgrade to Growth and learn more
                    about how your Arcades are performing.
                  </p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">Upgrade</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Select value="tags" onValueChange={() => {}}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tags">Tags</SelectItem>
              </SelectContent>
            </Select>

            <Select value="folders" onValueChange={() => {}}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="folders">Folders</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch checked={showInternal} onCheckedChange={setShowInternal} />
              <span className="text-sm">Show internal viewers</span>
            </div>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Past 7 days</SelectItem>
              <SelectItem value="30days">Past 30 days</SelectItem>
              <SelectItem value="90days">Past 90 days</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{metric.title}</span>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      {metric.subtitle && <span className="text-sm text-muted-foreground">{metric.subtitle}</span>}
                    </div>
                    <div
                      className={`flex items-center mt-2 text-sm ${
                        metric.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {metric.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {metric.change}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Arcade Performance Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle>Arcade Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Arcade</th>
                      <th className="text-left py-3 px-4">Players</th>
                      <th className="text-left py-3 px-4">Completion Rate</th>
                      <th className="text-left py-3 px-4">CTA Click Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arcadeData.map((arcade, index) => (
                      <motion.tr
                        key={arcade.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4 font-medium">{arcade.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{arcade.players}</span>
                            <span className="text-xs text-muted-foreground">→ {arcade.trends.players}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{arcade.completionRate}</span>
                            <span
                              className={`text-xs ${
                                arcade.trends.completion.startsWith("+")
                                  ? "text-green-600"
                                  : arcade.trends.completion.startsWith("-")
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              → {arcade.trends.completion}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span>{arcade.ctaClickRate}</span>
                            <span
                              className={`text-xs ${
                                arcade.trends.cta.startsWith("+")
                                  ? "text-green-600"
                                  : arcade.trends.cta.startsWith("-")
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              → {arcade.trends.cta}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
