import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ChevronRight, CalendarDays } from "lucide-react";
import { useDeviceDetection } from "../../hooks/useDeviceDetection";
import ParityFormRenderer from "../FormRendererParity/ParityFormRenderer";
import MonthYearSelector from "./MonthYearSelector";
import { type AllowedDate } from "./EventDateSelector";
import ComplianceCalendarModal from "./ComplianceCalendarModal";

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSubmissions?: () => void;
  form: any | null;
  loading?: boolean;
  formValues?: Record<string, any>;
  onFormChange?: (field: string, value: any) => void;
  onSubmit?: (values: Record<string, any>) => void;
  isSubmitting?: boolean;
  /** Current selected reporting month ("YYYY-MM"), shown when form is PERM + requireMonth */
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  /**
   * Compliance-approved months from the backend API ("YYYY-MM").
   * Passed straight through to MonthYearSelector:
   *   undefined → unrestricted fallback (rolling 12 months)
   *   []        → no window open (locked message shown)
   *   [...] → only these are selectable
   */
  allowedMonths?: string[];
  /** Explicitly locked months returned by the compliance API */
  lockedMonths?: string[];
  /**
   * Per-date schedule for the selected month (daily/weekly modes only).
   * undefined  → no date selection needed (mode = "none")
   * []         → no scheduled dates this month
   * [...]      → selectable event dates
   */
  allowedDates?: AllowedDate[];
  /** Currently selected event date ("YYYY-MM-DD") */
  selectedEventDate?: string;
  onEventDateChange?: (date: string) => void;
  /** True while the allowed-dates API fetch is in flight */
  eventDatesLoading?: boolean;
  /** "daily" | "weekly" | "none" — from the calendar */
  trackingMode?: string;
  submissionBlocked?: boolean;
  submissionBlockMessage?: string;
}

export default function FormDrawer({
  isOpen,
  onClose,
  onViewSubmissions,
  form,
  loading = false,
  formValues = {},
  onFormChange,
  onSubmit,
  isSubmitting = false,
  selectedMonth,
  onMonthChange,
  allowedMonths,
  lockedMonths = [],
  allowedDates,
  selectedEventDate = "",
  onEventDateChange,
  eventDatesLoading = false,
  trackingMode = "none",
  submissionBlocked = false,
  submissionBlockMessage,
}: FormDrawerProps) {
  const { isMobile } = useDeviceDetection();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const requiresMonth =
    form?.permSettings?.enabled && form?.permSettings?.requireMonth;

  // Show event-date picker when trackingMode is daily or weekly
  const requiresEventDate = requiresMonth && (trackingMode === "daily" || trackingMode === "weekly");

  const selectors = requiresMonth && selectedMonth && onMonthChange ? (
    <div className="px-6 pt-4 pb-3 border-b border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 space-y-4">
      {/* Step 1 — Month */}
      <MonthYearSelector
        value={selectedMonth}
        onChange={onMonthChange}
        disabled={isSubmitting}
        allowedDates={allowedMonths}
        lockedDates={lockedMonths}
      />

      {/* Step 2 — Compliance calendar modal trigger (daily / weekly modes only) */}
      {requiresEventDate && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs dark:border-blue-800 dark:bg-blue-950/20">
            <div className="text-blue-800 dark:text-blue-300">
              {selectedEventDate ? (
                <>
                  Selected date: <span className="font-semibold">{selectedEventDate}</span>
                </>
              ) : (
                "No date selected yet"
              )}
            </div>
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Open Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  if (isMobile) {
    // Mobile: Bottom Sheet
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Bottom Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {form?.configuration?.projectName || "Form"}
                  </h2>
                  {onViewSubmissions && (
                    <button
                      onClick={onViewSubmissions}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Submissions
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                  aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Month + Event-date selectors — only when PERM + requireMonth */}
              {selectors}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : form ? (
                  <ParityFormRenderer
                    form={form}
                    onSubmit={onSubmit}
                    disableSubmit={submissionBlocked}
                    disableReason={submissionBlockMessage}
                  />
                ) : (
                  <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    No form selected
                  </div>
                )}
              </div>

              {/* Footer - Submit button is now handled by ParityFormRenderer */}
            </motion.div>

            {requiresEventDate && selectedMonth && onMonthChange && (
              <ComplianceCalendarModal
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
                allowedMonths={allowedMonths}
                lockedMonths={lockedMonths}
                dates={allowedDates ?? []}
                selectedDate={selectedEventDate}
                onDateSelect={onEventDateChange ?? (() => {})}
                loading={eventDatesLoading}
              />
            )}
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Side Drawer
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Side Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-[700px] max-w-[90vw] z-50 bg-white dark:bg-gray-800 shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}>
            {/* Content Wrapper with Relative Positioning */}
            <div className="flex flex-col h-full relative">
              {/* Center Edge Close Button */}
              <button
                onClick={onClose}
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
                title="Close Form">
                <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </button>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {form?.configuration?.projectName || "Form"}
                  </h2>
                  {onViewSubmissions && (
                    <button
                      onClick={onViewSubmissions}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Submissions
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Month + Event-date selectors — only when PERM + requireMonth */}
              {selectors}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : form ? (
                  <ParityFormRenderer
                    form={form}
                    onSubmit={onSubmit}
                    disableSubmit={submissionBlocked}
                    disableReason={submissionBlockMessage}
                  />
                ) : (
                  <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    No form selected
                  </div>
                )}
              </div>

              {/* Footer is now handled by ParityFormRenderer */}
            </div>
          </motion.div>

          {requiresEventDate && selectedMonth && onMonthChange && (
            <ComplianceCalendarModal
              isOpen={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
              allowedMonths={allowedMonths}
              lockedMonths={lockedMonths}
              dates={allowedDates ?? []}
              selectedDate={selectedEventDate}
              onDateSelect={onEventDateChange ?? (() => {})}
              loading={eventDatesLoading}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
