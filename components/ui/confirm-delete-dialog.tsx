"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * Type-to-confirm destructive action. The Delete button stays disabled until
 * the user types `confirmText` exactly (case-sensitive). Whitespace at the
 * ends is trimmed to forgive accidental copy-paste padding.
 *
 * Use the business name for single-record deletes, and the literal string
 * "DELETE" for bulk deletes where there is no single name.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  confirmHint,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: React.ReactNode
  confirmText: string
  confirmHint?: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const [typed, setTyped] = useState("")

  useEffect(() => {
    if (!open) setTyped("")
  }, [open])

  const matches = typed.trim() === confirmText
  const hint =
    confirmHint ?? `Type ${confirmText === "DELETE" ? "DELETE" : "the name"} below to confirm.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-orage-black border border-red-500/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-red-400 tracking-wider text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/70 font-body">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-mono">
            {hint}
          </p>
          <div
            className="rounded border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-gold select-all"
            aria-label="Required confirmation text"
          >
            {confirmText}
          </div>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onPaste={(e) => {
              const txt = e.clipboardData.getData("text").trim()
              if (txt === confirmText) {
                e.preventDefault()
                setTyped(txt)
              }
            }}
            placeholder="Type to confirm"
            autoFocus
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-red-500/60"
          />
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/15"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm()}
              disabled={!matches || loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Deleting…" : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
