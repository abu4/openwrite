import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { StatusBar } from "@/components/status-bar"
import TiptapEditor from "@/components/tiptap-editor"
import { api } from "@/lib/api"
import { countWordsInHtml } from "@/lib/word-count"

const AUTOSAVE_DELAY_MS = 1500

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error"

export const Route = createFileRoute("/projects/$projectId/write")({
  component: WriteInterface,
})

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function saveStatusText(state: SaveState, savedAt: string | null): string {
  switch (state) {
    case "dirty":
      return "Unsaved changes"
    case "saving":
      return "Saving…"
    case "error":
      return "Save failed — retrying on next edit"
    case "saved":
      return savedAt ? `Saved at ${formatTime(savedAt)}` : "Saved"
    default:
      return savedAt ? `Last saved at ${formatTime(savedAt)}` : "Not saved yet"
  }
}

function WriteInterface() {
  const { projectId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: doc, isLoading } = useQuery({
    queryKey: ["project-content", projectId],
    queryFn: async () => await api.content.get(projectId),
  })

  const [wordCount, setWordCount] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const pendingRef = useRef({ content: "", dirty: false })
  const timerRef = useRef(0)

  // Seed word count and last-saved time from the loaded document
  useEffect(() => {
    if (doc) {
      setWordCount(doc.wordCount)
      setSavedAt(doc.updatedAt)
    }
  }, [doc])

  const { mutate: saveContent } = useMutation({
    mutationFn: async (content: string) => await api.content.save(projectId, content),
    onSuccess: (result) => {
      setSavedAt(result.savedAt)
      setSaveState(pendingRef.current.dirty ? "dirty" : "saved")
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
    },
    onError: () => {
      pendingRef.current.dirty = true
      setSaveState("error")
    },
  })

  const handleEditorUpdate = useCallback(
    (content: string) => {
      pendingRef.current = { content, dirty: true }
      setWordCount(countWordsInHtml(content))
      setSaveState("dirty")
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        pendingRef.current.dirty = false
        setSaveState("saving")
        saveContent(pendingRef.current.content)
      }, AUTOSAVE_DELAY_MS)
    },
    [saveContent]
  )

  // Flush any unsaved changes when navigating away
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current)
      if (pendingRef.current.dirty) {
        api.content.save(projectId, pendingRef.current.content).catch((error) => {
          console.error("Failed to save draft on exit:", error)
        })
      }
    },
    [projectId]
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your manuscript…</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <TiptapEditor
          content={doc?.content ?? ""}
          onUpdate={handleEditorUpdate}
          placeholder="Begin your story... Ask the AI assistant for help with characters, plot, or writing style."
        />
      </div>
      <StatusBar lastSavedText={saveStatusText(saveState, savedAt)} wordCount={wordCount} />
    </div>
  )
}
