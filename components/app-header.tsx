"use client"

import { Mail } from "lucide-react"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Mail className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-card-foreground tracking-tight">Gmail AI Agent</span>
        </div>

        {/* Right: placeholder */}
        <div className="flex items-center gap-2" />
      </div>
    </header>
  )
}
