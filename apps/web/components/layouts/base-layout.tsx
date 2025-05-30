"use client"

import { Header } from "@/components/header"

interface BaseLayoutProps {
  children: React.ReactNode
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  )
} 