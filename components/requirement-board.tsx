"use client"

import { useState, useCallback } from "react"
import { RequirementUpload } from "@/components/requirement-upload"
import { RequirementResult } from "@/components/requirement-result"
import { TicketList } from "@/components/ticket-list"
import { AlertCircle } from "lucide-react"

interface AnalysisResult {
  title: string
  description: string
}

export function RequirementBoard() {
  const [text, setText] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [ticketRefresh, setTicketRefresh] = useState(0)

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true)
    setAnalyzeError(null)

    try {
      const res = await fetch("/api/ai/analyze-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, images }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAnalyzeError(data.error || "AI 分析失败")
        return
      }

      setResult({ title: data.title, description: data.description })
    } catch {
      setAnalyzeError("网络错误，请重试")
    } finally {
      setAnalyzing(false)
    }
  }, [text, images])

  const handleJiraCreated = useCallback(() => {
    setTicketRefresh((n) => n + 1)
    setResult(null)
    setText("")
    setImages([])
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-4 lg:px-6 py-6 space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{"上传需求"}</h2>
        <RequirementUpload
          text={text}
          onTextChange={setText}
          images={images}
          onImagesChange={setImages}
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
        />
      </div>

      {analyzeError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{analyzeError}</span>
        </div>
      )}

      {result && (
        <RequirementResult
          result={result}
          onResultChange={setResult}
          requirementText={text}
          images={images}
          onRegenerating={setAnalyzing}
          onJiraCreated={handleJiraCreated}
        />
      )}

      <TicketList refreshSignal={ticketRefresh} />
    </main>
  )
}
