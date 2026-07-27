"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { apiFetch } from "@/lib/api"
import {
  Plus,
  Search,
  Edit,
  Archive,
  ArchiveRestore,
  FileCode,
  RefreshCw,
  Clock,
  HardDrive,
  MoreVertical,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SampleTestCase {
  input: string
  output: string
}

interface Problem {
  _id: string
  title: string
  slug: string
  statement: string
  inputFormat: string
  outputFormat: string
  constraints: string
  sampleTestCases: SampleTestCase[]
  timelimit: number
  memorylimit: number
  difficulty: "Easy" | "Medium" | "Hard"
  isActive: boolean
  createdAt: string
}

interface ProblemFormData {
  title: string
  slug: string
  statement: string
  inputFormat: string
  outputFormat: string
  constraints: string
  sampleTestCases: SampleTestCase[]
  timelimit: string
  memorylimit: string
  difficulty: "Easy" | "Medium" | "Hard" | ""
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyConfig = {
  Easy: { className: "bg-success/10 text-success border-success/20" },
  Medium: { className: "bg-warning/10 text-warning border-warning/20" },
  Hard: { className: "bg-error/10 text-error border-error/20" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const emptyForm = (): ProblemFormData => ({
  title: "",
  slug: "",
  statement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  sampleTestCases: [{ input: "", output: "" }],
  timelimit: "1000",
  memorylimit: "256",
  difficulty: "",
})

// ─── Problem Form ─────────────────────────────────────────────────────────────

interface ProblemFormProps {
  open: boolean
  onClose: () => void
  editingProblem: Problem | null
  onSuccess: () => void
}

function ProblemForm({ open, onClose, editingProblem, onSuccess }: ProblemFormProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<ProblemFormData>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!editingProblem

  useEffect(() => {
    if (open) {
      if (editingProblem) {
        setForm({
          title: editingProblem.title,
          slug: editingProblem.slug,
          statement: editingProblem.statement,
          inputFormat: editingProblem.inputFormat,
          outputFormat: editingProblem.outputFormat,
          constraints: editingProblem.constraints,
          sampleTestCases:
            editingProblem.sampleTestCases.length > 0
              ? editingProblem.sampleTestCases
              : [{ input: "", output: "" }],
          timelimit: String(editingProblem.timelimit),
          memorylimit: String(editingProblem.memorylimit),
          difficulty: editingProblem.difficulty,
        })
      } else {
        setForm(emptyForm())
      }
      setZipFile(null)
    }
  }, [open, editingProblem])

  const setField = (key: keyof ProblemFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setSampleTestCase = (idx: number, field: "input" | "output", val: string) =>
    setForm((f) => ({
      ...f,
      sampleTestCases: f.sampleTestCases.map((tc, i) =>
        i === idx ? { ...tc, [field]: val } : tc
      ),
    }))

  const addSampleTestCase = () =>
    setForm((f) => ({
      ...f,
      sampleTestCases: [...f.sampleTestCases, { input: "", output: "" }],
    }))

  const removeSampleTestCase = (idx: number) =>
    setForm((f) => ({
      ...f,
      sampleTestCases: f.sampleTestCases.filter((_, i) => i !== idx),
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.difficulty) {
      toast({ title: "Validation Error", description: "Please select a difficulty level.", variant: "destructive" })
      return
    }

    if (!isEdit && !zipFile) {
      toast({ title: "Validation Error", description: "Hidden test cases ZIP file is required.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        // Edit uses JSON PATCH (no file required)
        const payload: Record<string, unknown> = {
          title: form.title,
          statement: form.statement,
          inputFormat: form.inputFormat,
          outputFormat: form.outputFormat,
          constraints: form.constraints,
          sampleTestCases: JSON.stringify(form.sampleTestCases),
          timelimit: Number(form.timelimit),
          memorylimit: Number(form.memorylimit),
          difficulty: form.difficulty,
        }
        await apiFetch(`/problems/${editingProblem!._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        toast({ title: "Problem updated", description: `"${form.title}" has been updated.` })
      } else {
        // Create uses multipart/form-data (zip required)
        const fd = new FormData()
        fd.append("title", form.title)
        fd.append("slug", form.slug)
        fd.append("statement", form.statement)
        fd.append("inputFormat", form.inputFormat)
        fd.append("outputFormat", form.outputFormat)
        fd.append("constraints", form.constraints)
        fd.append("sampleTestCases", JSON.stringify(form.sampleTestCases))
        fd.append("timelimit", form.timelimit)
        fd.append("memorylimit", form.memorylimit)
        fd.append("difficulty", form.difficulty)
        fd.append("testcases", zipFile!)

        await apiFetch("/problems/create", {
          method: "POST",
          body: fd,
        })
        toast({ title: "Problem created", description: `"${form.title}" has been added.` })
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Problem" : "Add Problem"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the problem details below."
              : "Fill in the details to create a new problem."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prob-title">Title *</Label>
              <Input
                id="prob-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Two Sum"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob-slug">
                Slug *{isEdit && <span className="ml-1 text-xs text-muted-foreground">(read-only)</span>}
              </Label>
              <Input
                id="prob-slug"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="two-sum"
                required
                disabled={isEdit}
                className={isEdit ? "opacity-60" : ""}
              />
            </div>
          </div>

          {/* Difficulty / Time / Memory */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="prob-difficulty">Difficulty *</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setField("difficulty", v as "Easy" | "Medium" | "Hard")}
              >
                <SelectTrigger id="prob-difficulty" className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob-timelimit">Time Limit (ms) *</Label>
              <Input
                id="prob-timelimit"
                type="number"
                min={100}
                max={10000}
                value={form.timelimit}
                onChange={(e) => setField("timelimit", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob-memorylimit">Memory Limit (MB) *</Label>
              <Input
                id="prob-memorylimit"
                type="number"
                min={128}
                max={1024}
                value={form.memorylimit}
                onChange={(e) => setField("memorylimit", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Statement */}
          <div className="space-y-1.5">
            <Label htmlFor="prob-statement">Problem Statement *</Label>
            <Textarea
              id="prob-statement"
              value={form.statement}
              onChange={(e) => setField("statement", e.target.value)}
              placeholder="Describe the problem..."
              rows={4}
              required
            />
          </div>

          {/* Input / Output Format */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prob-inputformat">Input Format *</Label>
              <Textarea
                id="prob-inputformat"
                value={form.inputFormat}
                onChange={(e) => setField("inputFormat", e.target.value)}
                placeholder="Describe the input format..."
                rows={3}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob-outputformat">Output Format *</Label>
              <Textarea
                id="prob-outputformat"
                value={form.outputFormat}
                onChange={(e) => setField("outputFormat", e.target.value)}
                placeholder="Describe the output format..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-1.5">
            <Label htmlFor="prob-constraints">Constraints *</Label>
            <Textarea
              id="prob-constraints"
              value={form.constraints}
              onChange={(e) => setField("constraints", e.target.value)}
              placeholder="e.g. 1 ≤ n ≤ 10^5"
              rows={2}
              required
            />
          </div>

          {/* Sample Test Cases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sample Test Cases</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSampleTestCase}>
                <Plus className="h-3.5 w-3.5" />
                Add Case
              </Button>
            </div>
            {form.sampleTestCases.map((tc, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Case {idx + 1}
                  </span>
                  {form.sampleTestCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSampleTestCase(idx)}
                      className="text-muted-foreground hover:text-error transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Input</span>
                    <Textarea
                      value={tc.input}
                      onChange={(e) => setSampleTestCase(idx, "input", e.target.value)}
                      placeholder="Input..."
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Output</span>
                    <Textarea
                      value={tc.output}
                      onChange={(e) => setSampleTestCase(idx, "output", e.target.value)}
                      placeholder="Expected output..."
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hidden Test Cases ZIP */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Hidden Test Cases (ZIP) *</Label>
              <div
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center transition-colors hover:bg-secondary/40"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                {zipFile ? (
                  <span className="text-sm font-medium text-primary">{zipFile.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium">Click to upload ZIP</span>
                    <span className="text-xs text-muted-foreground">
                      Must contain input/output files for hidden test cases
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Problem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Archive/Unarchive Confirm Dialog ─────────────────────────────────────────

interface ArchiveDialogProps {
  problem: Problem | null
  onClose: () => void
  onSuccess: () => void
}

function ArchiveDialog({ problem, onClose, onSuccess }: ArchiveDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  if (!problem) return null

  const isArchiving = problem.isActive

  const handle = async () => {
    setLoading(true)
    try {
      const endpoint = isArchiving
        ? `/problems/${problem._id}/archive`
        : `/problems/${problem._id}/unarchive`
      await apiFetch(endpoint, { method: "PATCH" })
      toast({
        title: isArchiving ? "Problem archived" : "Problem restored",
        description: `"${problem.title}" has been ${isArchiving ? "archived" : "restored"}.`,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={!!problem} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchiving ? "Archive Problem?" : "Restore Problem?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchiving
              ? `"${problem.title}" will be hidden from public problem lists but not deleted. You can restore it later.`
              : `"${problem.title}" will be made publicly visible again.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={loading}
            className={
              isArchiving
                ? "bg-warning text-warning-foreground hover:bg-warning/90"
                : "bg-success text-success-foreground hover:bg-success/90"
            }
          >
            {loading && <Loader2 className="animate-spin" />}
            {isArchiving ? "Archive" : "Restore"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

interface ActionDropdownProps {
  problem: Problem
  onEdit: () => void
  onArchive: () => void
}

function ActionDropdown({ problem, onEdit, onArchive }: ActionDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
            onMouseDown={onEdit}
          >
            <Edit className="h-4 w-4" />
            Edit Problem
          </button>
          <button
            className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors ${
              problem.isActive ? "text-warning" : "text-success"
            }`}
            onMouseDown={onArchive}
          >
            {problem.isActive ? (
              <>
                <Archive className="h-4 w-4" />
                Archive
              </>
            ) : (
              <>
                <ArchiveRestore className="h-4 w-4" />
                Restore
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProblemsPage() {
  const { toast } = useToast()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [archiveProblem, setArchiveProblem] = useState<Problem | null>(null)

  const fetchProblems = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await apiFetch("/problems/all")
      setProblems(data.data ?? [])
    } catch (err: unknown) {
      toast({
        title: "Failed to load problems",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchProblems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditingProblem(null)
    setFormOpen(true)
  }

  const openEdit = (p: Problem) => {
    setEditingProblem(p)
    setFormOpen(true)
  }

  const filtered = problems.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    const matchDiff =
      difficultyFilter === "all" || p.difficulty === difficultyFilter
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "archived" && !p.isActive)
    return matchSearch && matchDiff && matchStatus
  })

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Problems</h1>
            <p className="text-muted-foreground">
              {problems.length} problem{problems.length !== 1 ? "s" : ""} in the database
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchProblems(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Problem
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="border border-border bg-card">
            <EmptyMedia variant="icon">
              <FileCode />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No problems found</EmptyTitle>
              <EmptyDescription>
                {problems.length === 0
                  ? "Get started by adding your first problem."
                  : "Try adjusting your filters."}
              </EmptyDescription>
            </EmptyHeader>
            {problems.length === 0 && (
              <EmptyContent>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Add Problem
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-left text-muted-foreground">
                    <th className="px-5 py-3.5 font-medium">Title</th>
                    <th className="px-5 py-3.5 font-medium">Difficulty</th>
                    <th className="px-5 py-3.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Time
                      </span>
                    </th>
                    <th className="px-5 py-3.5 font-medium">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" />
                        Memory
                      </span>
                    </th>
                    <th className="px-5 py-3.5 font-medium">Slug</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Created</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((problem) => (
                    <tr
                      key={problem._id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium">
                        <span className="block max-w-[200px] truncate" title={problem.title}>
                          {problem.title}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            difficultyConfig[problem.difficulty].className
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {problem.timelimit}ms
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {problem.memorylimit}MB
                      </td>
                      <td className="px-5 py-4">
                        <code className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                          {problem.slug}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        {problem.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(problem.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ActionDropdown
                          problem={problem}
                          onEdit={() => openEdit(problem)}
                          onArchive={() => setArchiveProblem(problem)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {problems.length} problems
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProblemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingProblem={editingProblem}
        onSuccess={() => fetchProblems(true)}
      />
      <ArchiveDialog
        problem={archiveProblem}
        onClose={() => setArchiveProblem(null)}
        onSuccess={() => fetchProblems(true)}
      />
      <Toaster />
    </>
  )
}