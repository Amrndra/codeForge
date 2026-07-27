"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/date-time-picker"
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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { apiFetch } from "@/lib/api"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Trophy,
  RefreshCw,
  Calendar,
  Lock,
  Globe,
  Loader2,
  MoreVertical,
  X,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProblemOption {
  _id: string
  title: string
  slug: string
  difficulty: "Easy" | "Medium" | "Hard"
}

interface ContestProblem {
  problem: string   // problem._id when sending, could be populated object when reading
  points: number
}

interface ContestProblemPopulated {
  problem: ProblemOption
  points: number
  _id?: string
}

interface Contest {
  _id: string
  title: string
  description: string
  problems: ContestProblemPopulated[]
  penaltyPerWrongSubmission: number
  startTime: string
  endTime: string
  isPublic: boolean
  createdAt: string
}

// List endpoint returns minimal fields; we load details on demand
interface ContestListItem {
  _id: string
  title: string
  startTime: string
  endTime: string
  isPublic: boolean
}

interface ContestFormData {
  title: string
  description: string
  isPublic: boolean
  startTime: Date | undefined
  endTime: Date | undefined
  penaltyPerWrongSubmission: string
  // problem selections: id -> points
  selectedProblems: { problemId: string; points: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyColors = {
  Easy: "text-success",
  Medium: "text-warning",
  Hard: "text-error",
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function contestStatus(contest: ContestListItem | Contest) {
  const now = new Date()
  const start = new Date(contest.startTime)
  const end = new Date(contest.endTime)
  if (now < start) return "upcoming"
  if (now >= start && now < end) return "active"
  return "ended"
}

const statusConfig = {
  upcoming: { label: "Upcoming", className: "bg-info/10 text-info" },
  active: { label: "Active", className: "bg-success/10 text-success" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
}

const emptyForm = (): ContestFormData => ({
  title: "",
  description: "",
  isPublic: true,
  startTime: undefined,
  endTime: undefined,
  penaltyPerWrongSubmission: "0",
  selectedProblems: [],
})

// ─── Problem Selector inside Form ─────────────────────────────────────────────

interface ProblemSelectorProps {
  availableProblems: ProblemOption[]
  selectedProblems: { problemId: string; points: string }[]
  onChange: (selected: { problemId: string; points: string }[]) => void
}

function ProblemSelector({ availableProblems, selectedProblems, onChange }: ProblemSelectorProps) {
  const selectedIds = new Set(selectedProblems.map((p) => p.problemId))
  const unselected = availableProblems.filter((p) => !selectedIds.has(p._id))
  const [toAdd, setToAdd] = useState<string>("")

  const addProblem = () => {
    if (!toAdd || selectedIds.has(toAdd)) return
    onChange([...selectedProblems, { problemId: toAdd, points: "100" }])
    setToAdd("")
  }

  const removeProblem = (id: string) => {
    onChange(selectedProblems.filter((p) => p.problemId !== id))
  }

  const setPoints = (id: string, pts: string) => {
    onChange(selectedProblems.map((p) => (p.problemId === id ? { ...p, points: pts } : p)))
  }

  const problemById = (id: string) => availableProblems.find((p) => p._id === id)

  return (
    <div className="space-y-3">
      <Label>Problems & Points *</Label>

      {/* Add problem row */}
      <div className="flex gap-2">
        <Select value={toAdd} onValueChange={setToAdd}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={unselected.length === 0 ? "All problems selected" : "Select a problem to add..."} />
          </SelectTrigger>
          <SelectContent>
            {unselected.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                <span className={`mr-2 text-xs font-medium ${difficultyColors[p.difficulty]}`}>
                  [{p.difficulty}]
                </span>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={addProblem} disabled={!toAdd}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Selected problems table */}
      {selectedProblems.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Problem</th>
                <th className="px-4 py-2.5 font-medium">Difficulty</th>
                <th className="px-4 py-2.5 font-medium w-32">Points</th>
                <th className="px-4 py-2.5 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {selectedProblems.map((sp) => {
                const prob = problemById(sp.problemId)
                if (!prob) return null
                return (
                  <tr key={sp.problemId} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{prob.title}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${difficultyColors[prob.difficulty]}`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="number"
                        min={1}
                        value={sp.points}
                        onChange={(e) => setPoints(sp.problemId, e.target.value)}
                        className="h-7 w-24 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => removeProblem(sp.problemId)}
                        className="text-muted-foreground hover:text-error transition-colors"
                        aria-label="Remove problem"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-secondary/20 py-8 text-center text-sm text-muted-foreground">
          No problems added yet. Select one above.
        </div>
      )}
    </div>
  )
}

// ─── Contest Form Dialog ───────────────────────────────────────────────────────

interface ContestFormProps {
  open: boolean
  onClose: () => void
  editingContest: Contest | null
  onSuccess: () => void
}

function ContestForm({ open, onClose, editingContest, onSuccess }: ContestFormProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<ContestFormData>(emptyForm())
  const [availableProblems, setAvailableProblems] = useState<ProblemOption[]>([])
  const [loadingProblems, setLoadingProblems] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!editingContest

  // Load problems list
  useEffect(() => {
    if (!open) return
    setLoadingProblems(true)
    apiFetch("/problems/all")
      .then((data) => setAvailableProblems(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingProblems(false))
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (!open) return
    if (editingContest) {
      setForm({
        title: editingContest.title,
        description: editingContest.description,
        isPublic: editingContest.isPublic,
        startTime: new Date(editingContest.startTime),
        endTime: new Date(editingContest.endTime),
        penaltyPerWrongSubmission: String(editingContest.penaltyPerWrongSubmission),
        selectedProblems: editingContest.problems.map((cp) => ({
          problemId: typeof cp.problem === "object" ? cp.problem._id : cp.problem,
          points: String(cp.points),
        })),
      })
    } else {
      setForm(emptyForm())
    }
  }, [open, editingContest])

  const setField = <K extends keyof ContestFormData>(key: K, value: ContestFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.startTime || !form.endTime) {
      toast({
        title: "Validation Error",
        description: "Please select both start and end times.",
        variant: "destructive",
      })
      return
    }

    if (form.selectedProblems.length === 0) {
      toast({
        title: "Validation Error",
        description: "A contest must have at least one problem.",
        variant: "destructive",
      })
      return
    }

    const problems = form.selectedProblems.map((sp) => ({
      problem: sp.problemId,
      points: Number(sp.points),
    }))

    const payload = {
      title: form.title,
      description: form.description,
      isPublic: form.isPublic,
      startTime: form.startTime.toISOString(),
      endTime: form.endTime.toISOString(),
      penaltyPerWrongSubmission: Number(form.penaltyPerWrongSubmission),
      problems,
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await apiFetch(`/contests/${editingContest!._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
        toast({ title: "Contest updated", description: `"${form.title}" has been updated.` })
      } else {
        await apiFetch("/contests/create", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast({ title: "Contest created", description: `"${form.title}" has been created.` })
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
          <DialogTitle>{isEdit ? "Edit Contest" : "Create Contest"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the contest details and problem list."
              : "Fill in the details to create a new contest."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="contest-title">Title *</Label>
            <Input
              id="contest-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Weekly Contest #26"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="contest-desc">Description *</Label>
            <Textarea
              id="contest-desc"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe the contest..."
              rows={3}
              required
            />
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contest-start">Start Time *</Label>
              <DateTimePicker
                id="contest-start"
                value={form.startTime}
                onChange={(d) => setField("startTime", d)}
                placeholder="Pick start date & time"
                fromDate={new Date()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contest-end">End Time *</Label>
              <DateTimePicker
                id="contest-end"
                value={form.endTime}
                onChange={(d) => setField("endTime", d)}
                placeholder="Pick end date & time"
                fromDate={form.startTime ?? new Date()}
              />
            </div>
          </div>

          {/* Penalty & Visibility */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contest-penalty">Penalty per Wrong Submission (min)</Label>
              <Input
                id="contest-penalty"
                type="number"
                min={0}
                value={form.penaltyPerWrongSubmission}
                onChange={(e) => setField("penaltyPerWrongSubmission", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <Switch
                id="contest-public"
                checked={form.isPublic}
                onCheckedChange={(v) => setField("isPublic", v)}
              />
              <div>
                <Label htmlFor="contest-public" className="cursor-pointer">
                  {form.isPublic ? (
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-success" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Private
                    </span>
                  )}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {form.isPublic ? "Visible to all users" : "Only admins can see this"}
                </p>
              </div>
            </div>
          </div>

          {/* Problem Selector */}
          {loadingProblems ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading problems...
            </div>
          ) : (
            <ProblemSelector
              availableProblems={availableProblems}
              selectedProblems={form.selectedProblems}
              onChange={(sp) => setField("selectedProblems", sp)}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Contest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  contest: ContestListItem | null
  onClose: () => void
  onSuccess: () => void
}

function DeleteDialog({ contest, onClose, onSuccess }: DeleteDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  if (!contest) return null

  const handle = async () => {
    setLoading(true)
    try {
      await apiFetch(`/contests/${contest._id}`, { method: "DELETE" })
      toast({ title: "Contest deleted", description: `"${contest.title}" has been deleted.` })
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
    <AlertDialog open={!!contest} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contest?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>"{contest.title}"</strong> and cannot be undone.
            Running contests cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Loader2 className="animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────

interface ContestActionDropdownProps {
  contest: ContestListItem
  onEdit: () => void
  onDelete: () => void
}

function ContestActionDropdown({ contest, onEdit, onDelete }: ContestActionDropdownProps) {
  const [open, setOpen] = useState(false)
  const status = contestStatus(contest)

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
            Edit Contest
          </button>
          <div className="my-1 border-t border-border" />
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-secondary transition-colors disabled:opacity-50"
            onMouseDown={onDelete}
            disabled={status === "active"}
            title={status === "active" ? "Cannot delete a running contest" : undefined}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminContestsPage() {
  const { toast } = useToast()
  const [contests, setContests] = useState<ContestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingContest, setEditingContest] = useState<Contest | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContestListItem | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const fetchContests = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await apiFetch("/contests")
      setContests(data.data ?? [])
    } catch (err: unknown) {
      toast({
        title: "Failed to load contests",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchContests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditingContest(null)
    setFormOpen(true)
  }

  const openEdit = async (contest: ContestListItem) => {
    setLoadingDetail(contest._id)
    try {
      const data = await apiFetch(`/contests/${contest._id}`)
      setEditingContest(data.data)
      setFormOpen(true)
    } catch (err: unknown) {
      toast({
        title: "Failed to load contest",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingDetail(null)
    }
  }

  const filtered = contests.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const status = contestStatus(c)
    const matchStatus = statusFilter === "all" || status === statusFilter
    const matchVis =
      visibilityFilter === "all" ||
      (visibilityFilter === "public" && c.isPublic) ||
      (visibilityFilter === "private" && !c.isPublic)
    return matchSearch && matchStatus && matchVis
  })

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Contests</h1>
            <p className="text-muted-foreground">
              {contests.length} contest{contests.length !== 1 ? "s" : ""} in the database
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchContests(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Contest
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="border border-border bg-card">
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No contests found</EmptyTitle>
              <EmptyDescription>
                {contests.length === 0
                  ? "Create your first contest to get started."
                  : "Try adjusting your filters."}
              </EmptyDescription>
            </EmptyHeader>
            {contests.length === 0 && (
              <EmptyContent>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Create Contest
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
                    <th className="px-5 py-3.5 font-medium">Contest</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Start Time
                      </span>
                    </th>
                    <th className="px-5 py-3.5 font-medium">End Time</th>
                    <th className="px-5 py-3.5 font-medium">Visibility</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((contest) => {
                    const status = contestStatus(contest)
                    const statusInfo = statusConfig[status]

                    return (
                      <tr
                        key={contest._id}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span
                            className="block max-w-[220px] truncate font-medium"
                            title={contest.title}
                          >
                            {contest.title}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                          >
                            {status === "active" && (
                              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                            )}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {formatDateTime(contest.startTime)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {formatDateTime(contest.endTime)}
                        </td>
                        <td className="px-5 py-4">
                          {contest.isPublic ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                              <Globe className="h-3.5 w-3.5" />
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" />
                              Private
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {loadingDetail === contest._id ? (
                            <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <ContestActionDropdown
                              contest={contest}
                              onEdit={() => openEdit(contest)}
                              onDelete={() => setDeleteTarget(contest)}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {contests.length} contests
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ContestForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingContest={editingContest}
        onSuccess={() => fetchContests(true)}
      />
      <DeleteDialog
        contest={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => fetchContests(true)}
      />
      <Toaster />
    </>
  )
}
