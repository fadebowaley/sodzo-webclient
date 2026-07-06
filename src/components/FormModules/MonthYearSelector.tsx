import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Lock, AlertTriangle, ChevronUp, History } from "lucide-react";

interface MonthYearSelectorProps {
  /** Current value as "YYYY-MM", e.g. "2026-02" */
  value: string;
  onChange: (value: string) => void;
  /**
   * Compliance-approved months ("YYYY-MM") returned by the backend.
   *   - undefined      → unrestricted: show rolling pastMonths window (legacy fallback)
   *   - [] empty array → no window: disable + show "No compliance window" banner
   *   - [...] list     → only these months are selectable
   */
  allowedDates?: string[];
  /**
   * Months that are explicitly locked for this node.
   * Shown with a lock icon even if included in allowedDates (edge case guard).
   */
  lockedDates?: string[];
  /** In fallback / unrestricted mode: how many past months to show (default 12) */
  pastMonths?: number;
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyToLabel(yyyyMm: string): string {
  const [yyyy, mm] = yyyyMm.split("-");
  const d = new Date(Number(yyyy), Number(mm) - 1, 1);
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}

function buildFallbackOptions(pastMonths: number) {
  const now = new Date();
  return Array.from({ length: pastMonths + 1 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return { value: `${yyyy}-${mm}`, label: monthKeyToLabel(`${yyyy}-${mm}`), isCurrent: i === 0 };
  });
}

/** Returns true when "YYYY-MM" is in the current month or later */
function isFutureOrCurrent(yyyyMm: string): boolean {
  return yyyyMm >= currentMonthValue();
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MonthYearSelector({
  value,
  onChange,
  allowedDates,
  lockedDates = [],
  pastMonths = 12,
  disabled = false,
}: MonthYearSelectorProps) {
  const isCompliance = allowedDates !== undefined;
  const noWindow = isCompliance && allowedDates.length === 0;

  // Toggle to reveal past (preceding) months
  const [showOlderPeriods, setShowOlderPeriods] = useState(false);

  // Build the full option list
  const allOptions = useMemo(() => {
    if (!isCompliance) {
      return buildFallbackOptions(pastMonths);
    }
    // Sort descending so current month comes first
    return [...allowedDates]
      .sort((a, b) => (b > a ? 1 : -1))
      .map((v) => ({
        value: v,
        label: monthKeyToLabel(v),
        isCurrent: v === currentMonthValue(),
      }));
  }, [isCompliance, allowedDates, pastMonths]);

  // Visible options depend on the toggle
  const visibleOptions = useMemo(() => {
    if (showOlderPeriods || !isCompliance) return allOptions;
    // Default: show current month onwards (current + future months)
    const current = currentMonthValue();
    const forward = allOptions.filter((o) => o.value >= current);
    // Always show at least the most recent option so the picker isn't empty
    return forward.length > 0 ? forward : allOptions.slice(0, 1);
  }, [allOptions, showOlderPeriods, isCompliance]);

  const pastOptionsCount = useMemo(
    () => allOptions.filter((o) => o.value < currentMonthValue()).length,
    [allOptions]
  );

  // Keep selected value sane: if not in visible list, reset to first option
  const safeValue = useMemo(() => {
    if (noWindow) return "";
    if (visibleOptions.find((o) => o.value === value)) return value;
    return visibleOptions[0]?.value ?? "";
  }, [noWindow, visibleOptions, value]);

  const selected = visibleOptions.find((o) => o.value === safeValue);
  const isLocked = lockedDates.includes(safeValue);
  const isBackdated = safeValue < currentMonthValue();

  // ── Empty compliance window ──────────────────────────────────────────────
  if (noWindow) {
    return (
      <div className="w-full">
        <Label />
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              No compliance window available
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              All submission periods for this module are currently locked.
              Contact your administrator to unlock a period.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal select ─────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-1.5">
      <Label isCompliance={isCompliance} />

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <CalendarDays className="h-4 w-4 text-blue-500" />
        </span>

        <select
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="
            w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-700
            pl-9 pr-8 py-2.5
            text-sm font-medium text-gray-900 dark:text-white
            shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {visibleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.isCurrent ? `${opt.label} (Current)` : opt.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          {isLocked ? (
            <span className="flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
              <Lock className="h-3 w-3" /> Period locked
            </span>
          ) : isBackdated ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Back-dated submission
            </span>
          ) : isCompliance ? (
            <span className="font-medium text-green-600 dark:text-green-400">
              Compliance window open
            </span>
          ) : (
            <span>Select the month this submission belongs to.</span>
          )}
        </p>

        {/* "Show older periods" toggle — only in compliance mode when there are past months */}
        {isCompliance && pastOptionsCount > 0 && (
          <button
            type="button"
            onClick={() => setShowOlderPeriods((p) => !p)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          >
            <History className="h-3 w-3" />
            {showOlderPeriods ? (
              <>
                Hide older periods
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                {pastOptionsCount} older period{pastOptionsCount !== 1 ? "s" : ""}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Older-periods info banner */}
      {isCompliance && showOlderPeriods && pastOptionsCount > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          You are viewing past submission periods. Use these only for back-dated
          corrections. Locked periods are read-only and cannot receive new
          submissions.
        </div>
      )}
    </div>
  );
}

// ── Small label sub-component ──────────────────────────────────────────────
function Label({ isCompliance = false }: { isCompliance?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      Reporting Month &amp; Year
      <span className="ml-1 text-red-500" aria-hidden>*</span>
      {isCompliance && (
        <span className="ml-2 rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
          Compliance-restricted
        </span>
      )}
    </label>
  );
}
