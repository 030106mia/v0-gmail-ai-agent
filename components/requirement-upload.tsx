"use client"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, X, Sparkles, Loader2 } from "lucide-react"

interface RequirementUploadProps {
  text: string
  onTextChange: (text: string) => void
  images: string[]
  onImagesChange: (images: string[]) => void
  onAnalyze: () => void
  analyzing: boolean
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function RequirementUpload({
  text,
  onTextChange,
  images,
  onImagesChange,
  onAnalyze,
  analyzing,
}: RequirementUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addImages = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"))
      if (imageFiles.length === 0) return

      const newImages = await Promise.all(imageFiles.map(fileToBase64))
      onImagesChange([...images, ...newImages])
    },
    [images, onImagesChange],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items)
      const imageItems = items.filter((item) => item.type.startsWith("image/"))
      if (imageItems.length === 0) return

      e.preventDefault()
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[]
      addImages(files)
    },
    [addImages],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(Array.from(e.target.files))
      e.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const canAnalyze = (text.trim().length > 0 || images.length > 0) && !analyzing

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          {"需求说明"}
        </label>
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={handlePaste}
          placeholder="描述你的需求，或直接粘贴截图（Ctrl+V / Cmd+V）..."
          className="min-h-[140px] text-sm leading-relaxed resize-none"
          disabled={analyzing}
        />
      </div>

      {images.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            {"已上传图片"} ({images.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="group relative size-20 rounded-lg border border-border overflow-hidden bg-muted"
              >
                <img
                  src={img}
                  alt={`上传图片 ${i + 1}`}
                  className="size-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
        >
          <ImagePlus className="size-3.5" />
          {"添加图片"}
        </Button>

        <Button
          size="sm"
          className="ml-auto text-xs"
          onClick={onAnalyze}
          disabled={!canAnalyze}
        >
          {analyzing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {"AI 分析中..."}
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              {"AI 分析需求"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
