"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  timeFilter: string
  onTimeFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  languageFilter: string
  onLanguageFilterChange: (value: string) => void
  viewMode: string
  onViewModeChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

const viewModes = [
  { label: "卡片", value: "card" },
  { label: "列表", value: "list" },
]

export function FilterBar({
  timeFilter,
  onTimeFilterChange,
  statusFilter,
  onStatusFilterChange,
  languageFilter,
  onLanguageFilterChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchQueryChange,
}: FilterBarProps) {
  return (
    <div className="sticky top-14 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Time filter */}
          <Select value={timeFilter} onValueChange={onTimeFilterChange}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{"今天"}</SelectItem>
              <SelectItem value="7days">{"近7天"}</SelectItem>
              <SelectItem value="30days">{"近30天"}</SelectItem>
              <SelectItem value="all">{"全部时间"}</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SlidersHorizontal className="size-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{"状态：全部"}</SelectItem>
              <SelectItem value="pending">{"待处理"}</SelectItem>
              <SelectItem value="replied">{"已回信"}</SelectItem>
              <SelectItem value="jira_created">{"已录入Jira"}</SelectItem>
              <SelectItem value="completed">{"已完成"}</SelectItem>
            </SelectContent>
          </Select>

          {/* Language filter */}
          <Select value={languageFilter} onValueChange={onLanguageFilterChange}>
            <SelectTrigger size="sm" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{"语言：全部"}</SelectItem>
              <SelectItem value="英文">{"英文"}</SelectItem>
              <SelectItem value="日文">{"日文"}</SelectItem>
              <SelectItem value="法文">{"法文"}</SelectItem>
              <SelectItem value="德文">{"德文"}</SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {viewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => onViewModeChange(mode.value)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors",
                  viewMode === mode.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="搜索发件人 / 主题 / 内容"
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
