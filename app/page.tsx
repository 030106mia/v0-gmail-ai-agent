"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { SidebarNav, type BoardType } from "@/components/sidebar-nav"
import { EmailBoard } from "@/components/email-board"
import { RequirementBoard } from "@/components/requirement-board"

export default function HomePage() {
  const [activeBoard, setActiveBoard] = useState<BoardType>("email")

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <SidebarNav activeBoard={activeBoard} onBoardChange={setActiveBoard} />
        <div className="flex-1 min-w-0">
          {activeBoard === "email" ? <EmailBoard /> : <RequirementBoard />}
        </div>
      </div>
    </div>
  )
}
