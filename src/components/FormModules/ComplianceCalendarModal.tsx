import { useMemo } from "react";
import { X, CalendarDays, Lock, CheckCircle2 } from "lucide-react";
import type { AllowedDate } from "./EventDateSelector";

interface ComplianceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allowedMonths?: string[];
  lockedMonths?: string[];
  dates: AllowedDate[];
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  loading?: boolean;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseMonth(yyyyMm: string) {
  const [yyyy, mm] = yyyyMm.split("-");
  return { year: Number(yyyy), month: Number(mm) };
}

function dateStatus(d: AllowedDate): "available" | "partial" | "full" | "locked" {
  if (d.locked || d.status === "locked") return "locked";
  if (d.isFull || d.status === "full") return "full";
  if ((d.submitted_count ?? d.submitted ?? 0) > 0 || d.status === "partial") return "partial";
  return "available";
}

export default function ComplianceCalendarModal({
  isOpen,
  onClose,
  selectedMonth,
  onMonthChange,
  allowedMonths,
  lockedMonths = [],
  dates,
  selectedDate,
  onDateSelect,
  loading = false,
}: ComplianceCalendarModalProps) {
  if (!isOpen) return null;

  const { year, month } = parseMonth(selectedMonth);

  const months = useMemo(
    () =>
      MONTH_NAMES.map((label, idx) => {
        const value = `${year}-${String(idx + 1).padStart(2, "0")}`;
        const inCompliance = allowedMonths ? allowedMonths.includes(value) : true;
        const locked = lockedMonths.includes(value);
        return {
          value,
          label,
          inCompliance,
          locked,
          selected: idx + 1 === month,
        };
      }),
    [year, month, allowedMonths, lockedMonths]
  );

  const selectedMonthAllowed =
    allowedMonths === undefined || allowedMonths.includes(selectedMonth);
  const selectedMonthLocked = lockedMonths.includes(selectedMonth);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Compliance Calendar ({year})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {months.map((m) => {
              const disabled = !m.inCompliance || m.locked;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => !disabled && onMonthChange(m.value)}
                  disabled={disabled}
                  className={[
                    "rounded-md border px-2 py-2 text-xs font-semibold transition-colors",
                    m.selected
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                      : disabled
                      ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-500"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {m.label}
                    {m.locked && <Lock className="h-3 w-3 text-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            {!selectedMonthAllowed ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This month has no compliance-approved dates.
              </p>
            ) : selectedMonthLocked ? (
              <p className="text-sm text-red-700 dark:text-red-300">
                Submission period locked for this month.
              </p>
            ) : loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading allowed dates...
              </p>
            ) : dates.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No allowed submission dates found for this month.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {dates.map((d) => {
                  const status = dateStatus(d);
                  const disabled = status === "full" || status === "locked";
                  const selected = selectedDate === d.date;
                  const required = d.quota_total ?? d.required ?? 0;
                  const submitted = d.submitted_count ?? d.submitted ?? 0;
                  const remaining = d.remaining_count ?? d.remaining ?? 0;

                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => {
                        if (disabled) return;
                        onDateSelect(d.date);
                        onClose();
                      }}
                      disabled={disabled}
                      className={[
                        "rounded-md border p-2 text-left text-xs transition-colors",
                        selected
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                          : status === "locked"
                          ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                          : status === "full"
                          ? "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
                          : status === "partial"
                          ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                          : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
                        disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{d.date}</span>
                        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <div className="mt-1 text-[10px] opacity-90">
                        {submitted}/{required} submitted • {remaining} remaining
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide font-semibold">
                        {status}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
