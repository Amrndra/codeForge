"use client"

import * as React from "react"
import { format, setHours, setMinutes } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ─── Time Scroll Column ────────────────────────────────────────────────────────

interface TimeColumnProps {
  values: string[]
  selected: string
  onSelect: (v: string) => void
}

function TimeColumn({ values, selected, onSelect }: TimeColumnProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Scroll selected item into view on mount / when selection changes
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const el = container.querySelector<HTMLElement>("[data-selected=true]")
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    }
  }, [selected])

  return (
    <div
      ref={containerRef}
      className="flex h-48 flex-col overflow-y-auto scroll-smooth no-scrollbar"
    >
      {values.map((v) => (
        <button
          key={v}
          type="button"
          data-selected={v === selected}
          onClick={() => onSelect(v)}
          className={cn(
            "w-full shrink-0 rounded-md px-3 py-1.5 text-center text-sm font-mono transition-colors",
            v === selected
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

// Generate padded number strings
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

// ─── DateTimePicker ────────────────────────────────────────────────────────────

export interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Minimum selectable date */
  fromDate?: Date
  id?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  disabled,
  fromDate,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedHour = value ? String(value.getHours()).padStart(2, "0") : "00"
  const selectedMinute = value ? String(value.getMinutes()).padStart(2, "0") : "00"

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined)
      return
    }
    // Preserve existing time when selecting a new day
    const h = value?.getHours() ?? 0
    const m = value?.getMinutes() ?? 0
    onChange(setMinutes(setHours(day, h), m))
  }

  const handleHourChange = (h: string) => {
    if (!value) {
      // Default to today + chosen time
      onChange(setHours(setMinutes(new Date(), Number(selectedMinute)), Number(h)))
    } else {
      onChange(setHours(value, Number(h)))
    }
  }

  const handleMinuteChange = (m: string) => {
    if (!value) {
      onChange(setMinutes(setHours(new Date(), Number(selectedHour)), Number(m)))
    } else {
      onChange(setMinutes(value, Number(m)))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {value ? (
            format(value, "MMM d, yyyy  HH:mm")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto p-0 overflow-hidden"
      >
        <div className="flex">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            fromDate={fromDate}
            captionLayout="dropdown"
            initialFocus
          />

          {/* Divider */}
          <div className="w-px bg-border" />

          {/* Time picker */}
          <div className="flex flex-col gap-2 p-3 w-36">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-1">
              <Clock className="h-3.5 w-3.5" />
              Time
            </div>
            <div className="flex gap-1">
              <div className="flex-1">
                <p className="mb-1 text-center text-xs text-muted-foreground">HH</p>
                <TimeColumn
                  values={hours}
                  selected={selectedHour}
                  onSelect={handleHourChange}
                />
              </div>
              <div className="flex items-center text-muted-foreground pt-6">:</div>
              <div className="flex-1">
                <p className="mb-1 text-center text-xs text-muted-foreground">MM</p>
                <TimeColumn
                  values={minutes}
                  selected={selectedMinute}
                  onSelect={handleMinuteChange}
                />
              </div>
            </div>

            {/* Done button */}
            <Button
              size="sm"
              className="mt-1 w-full"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
