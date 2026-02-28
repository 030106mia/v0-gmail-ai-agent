"use client"

import { Mail, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export type BoardType = "email" | "requirement"

interface SidebarNavProps {
  activeBoard: BoardType
  onBoardChange: (board: BoardType) => void
}

const navItems = [
  { id: "email" as const, label: "邮件看板", icon: Mail, desc: "Gmail Support 收件分析" },
  { id: "requirement" as const, label: "需求看板", icon: FileText, desc: "需求分析与 Jira 管理" },
]

export function SidebarNav({ activeBoard, onBoardChange }: SidebarNavProps) {
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border bg-card/50">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeBoard === item.id
          return (
            <button
              key={item.id}
              onClick={() => onBoardChange(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <div className="min-w-0">
                <span className="block text-sm font-medium leading-tight">{item.label}</span>
                <span className="block text-[10px] leading-tight opacity-60 mt-0.5">{item.desc}</span>
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
