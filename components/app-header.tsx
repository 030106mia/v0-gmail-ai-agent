"use client"

import { Mail, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

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

        {/* Right: User */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              J
            </div>
            <span className="hidden sm:inline">{"工作空间"}</span>
            <ChevronDown className="size-3" />
          </Button>
        </div>
      </div>
    </header>
  )
}
