/**
 * EventDateSelector
 *
 * Shown below the MonthYearSelector when the module's trackingMode is
 * "daily" or "weekly". Renders all scheduled dates for the selected month
 * as a compact interactive grid, each tile showing capacity and status.
 *
 * Props:
 *   dates        – from GET /v1/submissions/allowed-dates (see AllowedDate type)
 *   value        – currently selected date ("YYYY-MM-DD" or "")
 *   onChange     – called with the chosen date string
 *   trackingMode – "daily" | "weekly"
 *   loading      – show skeleton while fetching
 */

import { useState } from "react";
import { Calendar, CheckCircle2, Lock, ChevronDown, ChevronUp, Clock } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AllowedDate {
  date: string;       // "YYYY-MM-DD"
  dayLabel: string;   // "Monday"
  required: number;   // slots available per date
  submitted: number;  // already submitted by this node
  remaining: number;
  isFull: boolean;
  isPast: boolean;
  locked?: boolean;
  status?: "available" | "partial" | "full" | "locked";
  quota_total?: number;
  submitted_count?: number;
  remaining_count?: number;
}

interface EventDateSelectorProps {
  dates: AllowedDate[];
  value: string;
  onChange: (date: string) => void;
  trackingMode: "daily" | "weekly";
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateLabel(iso: string): { day: string; date: string } {
  const d = new Date(iso + "T00:00:00Z");
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    date: d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" }),
  };
}

function slotLabel(submitted: number, required: number): string {
  if (required === 1) return submitted === 0 ? "Open" : "Done";
  return `${submitted}/${required}`;
}

type TileStatus = "available" | "partial" | "full" | "locked" | "past";

function tileStatus(d: AllowedDate): TileStatus {
  if (d.locked || d.status === "locked") return "locked";
  if (d.isFull) return d.isPast ? "past" : "full";
  if (d.submitted > 0) return "partial";
  if (d.isPast) return "past";
  return "available";
}

const TILE_STYLES: Record<TileStatus, string> = {
  available:
    "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 cursor-pointer",
  partial:
    "border-amber-300 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20 hover:border-amber-400 cursor-pointer",
  full:
    "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20 cursor-not-allowed opacity-70",
  locked:
    "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20 cursor-not-allowed opacity-70",
  past:
    "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30 cursor-not-allowed opacity-50",
};

const SELECTED_STYLE =
  "ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400 border-blue-500";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function EventDateSelector({
  dates,
  value,
  onChange,
  trackingMode,
  loading = false,
}: EventDateSelectorProps) {
  const [showPastDates, setShowPastDates] = useState(false);

  if (loading) {
    return (
      <div className="w-full space-y-2">
        <Label trackingMode={trackingMode} />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!dates || dates.length === 0) {
    return (
      <div className="w-full">
        <Label trackingMode={trackingMode} />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No scheduled dates for this month.
        </p>
      </div>
    );
  }

  const pastDates    = dates.filter((d) => d.isPast && d.isFull);
  const activeDates  = dates.filter((d) => !d.isPast || !d.isFull);
  const pastHidden   = dates.filter((d) => d.isPast && d.isFull && !showPastDates);
  const visibleDates = showPastDates ? dates : activeDates;

  const totalRequired  = dates.reduce((s, d) => s + d.required, 0);
  const totalSubmitted = dates.reduce((s, d) => s + d.submitted, 0);
  const pct            = totalRequired > 0 ? Math.round((totalSubmitted / totalRequired) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Label trackingMode={trackingMode} />
        {/* Month summary */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className={`font-semibold ${pct === 100 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
            {totalSubmitted}/{totalRequired}
          </span>{" "}
          submitted this month
        </span>
      </div>

      {/* Date tiles */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {visibleDates.map((d) => {
          const status   = tileStatus(d);
          const selected = d.date === value;
          const disabled = status === "full" || status === "past" || status === "locked";
          const labels   = formatDateLabel(d.date);

          return (
            <button
              key={d.date}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(d.date)}
              aria-pressed={selected}
              title={`${d.dayLabel} ${d.date} — ${slotLabel(d.submitted, d.required)}`}
              className={`
                relative flex flex-col items-center justify-center rounded-lg border p-2 text-center
                transition-all duration-150
                ${TILE_STYLES[status]}
                ${selected ? SELECTED_STYLE : ""}
              `}
            >
              {/* Day-of-week */}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {labels.day}
              </span>

              {/* Date number */}
              <span className={`mt-0.5 text-base font-bold leading-none
                ${selected ? "text-blue-700 dark:text-blue-300"
                  : status === "available" ? "text-gray-800 dark:text-gray-100"
                  : status === "partial" ? "text-amber-700 dark:text-amber-300"
                  : "text-gray-500 dark:text-gray-500"}`}
              >
                {labels.date.split(" ")[0]}
              </span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500">
                {labels.date.split(" ")[1]}
              </span>

              {/* Slot indicator */}
              <SlotBadge status={status} submitted={d.submitted} required={d.required} />

              {/* Selected tick */}
              {selected && (
                <span className="absolute -right-1 -top-1">
                  <CheckCircle2 className="h-4 w-4 fill-blue-500 text-white dark:fill-blue-400" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Past / full dates toggle */}
      {pastDates.length > 0 && pastHidden.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPastDates((p) => !p)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
        >
          <Clock className="h-3 w-3" />
          {showPastDates ? (
            <>Hide completed past dates <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>{pastDates.length} past date{pastDates.length !== 1 ? "s" : ""} hidden <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}

      {/* Selected date summary */}
      {value && (
        <SelectedSummary date={dates.find((d) => d.date === value)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Label({ trackingMode }: { trackingMode: string }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        Submission Date
        <span className="text-red-500" aria-hidden>*</span>
        <span className="ml-1 rounded-full bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 capitalize">
          {trackingMode}
        </span>
      </span>
    </label>
  );
}

function SlotBadge({ status, submitted, required }: { status: TileStatus; submitted: number; required: number }) {
  if (status === "locked") {
    return (
      <span className="mt-1 flex items-center gap-0.5 rounded-full bg-red-200 dark:bg-red-800/50 px-1.5 py-0.5 text-[9px] font-semibold text-red-700 dark:text-red-300">
        <Lock className="h-2.5 w-2.5" /> Locked
      </span>
    );
  }
  if (status === "past") {
    return (
      <span className="mt-1 flex items-center gap-0.5 rounded-full bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400">
        <Lock className="h-2.5 w-2.5" /> Past
      </span>
    );
  }
  if (status === "full") {
    return (
      <span className="mt-1 rounded-full bg-green-200 dark:bg-green-800/50 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:text-green-300">
        Full
      </span>
    );
  }
  if (required > 1) {
    return (
      <span className={`mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold
        ${submitted > 0
          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"}`}
      >
        {submitted}/{required}
      </span>
    );
  }
  return (
    <span className="mt-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-300">
      Open
    </span>
  );
}

function SelectedSummary({ date }: { date: AllowedDate | undefined }) {
  if (!date) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-xs">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
      <span className="text-blue-800 dark:text-blue-200">
        <span className="font-semibold">{date.dayLabel}, {date.date}</span>
        {" — "}
        {date.required > 1
          ? `${date.submitted} of ${date.required} submissions done for this date`
          : date.submitted === 0
          ? "No submission yet for this date"
          : "Already submitted for this date"}
        {date.remaining > 0 && date.required > 1 && (
          <span className="ml-1 text-amber-700 dark:text-amber-300">
            ({date.remaining} slot{date.remaining !== 1 ? "s" : ""} remaining)
          </span>
        )}
      </span>
    </div>
  );
}
