import { useEffect, useState } from "react";
import {
  formatTimeRemaining,
  getSecondsUntilReset,
} from "../../utils/rateLimit";
import type { RateLimitInfo } from "../../utils/rateLimit";

interface RateLimitErrorProps {
  retryAfter?: number;
  rateLimitInfo?: RateLimitInfo;
  onDismiss?: () => void;
}

export default function RateLimitError({
  retryAfter,
  rateLimitInfo,
  onDismiss,
}: RateLimitErrorProps) {
  const [timeRemaining, setTimeRemaining] = useState(retryAfter || 0);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0 && onDismiss) {
          onDismiss();
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onDismiss]);

  // Also update from rateLimitInfo if available
  useEffect(() => {
    if (rateLimitInfo) {
      const seconds = getSecondsUntilReset(rateLimitInfo);
      setTimeRemaining(seconds);
    }
  }, [rateLimitInfo]);

  if (timeRemaining <= 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Too Many Login Attempts
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>
              You've exceeded the rate limit. Please wait{" "}
              <span className="font-semibold">
                {formatTimeRemaining(timeRemaining)}
              </span>{" "}
              before trying again.
            </p>
            {rateLimitInfo && (
              <p className="mt-1 text-xs">
                {rateLimitInfo.remaining} of {rateLimitInfo.limit} attempts
                remaining
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 flex-shrink-0 text-red-400 hover:text-red-500">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
