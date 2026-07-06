import { Node } from "../../utils/networkHelpers";

interface LevelBadgeProps {
  level?:
    | {
        id?: string;
        _id?: string;
        name?: string;
      }
    | string
    | null;
}

const LEVEL_BADGE_STYLES: Record<
  string,
  { dot: string; bg: string; text: string }
> = {
  root: {
    dot: "bg-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-800 dark:text-violet-300",
  },
  division: {
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-800 dark:text-blue-300",
  },
  diocese: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  zone: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-800 dark:text-amber-300",
  },
  parish: {
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-800 dark:text-rose-300",
  },
  default: {
    dot: "bg-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
  },
};

export function LevelBadge({ level }: LevelBadgeProps) {
  // Handle case where level might be null, undefined, or not have name
  if (!level) {
    const fallback = LEVEL_BADGE_STYLES.default;
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${fallback.bg} ${fallback.text}`}>
        <span className={`h-2 w-2 rounded-full ${fallback.dot}`} />
        Unknown
      </span>
    );
  }

  // Extract name safely - handle both object and string cases
  let levelName: string;
  if (typeof level === "string") {
    levelName = level;
  } else if (level && typeof level === "object") {
    levelName = level.name || level.id || level._id || "Unknown";
  } else {
    levelName = String(level);
  }

  if (!levelName || levelName === "Unknown") {
    const fallback = LEVEL_BADGE_STYLES.default;
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${fallback.bg} ${fallback.text}`}>
        <span className={`h-2 w-2 rounded-full ${fallback.dot}`} />
        Unknown
      </span>
    );
  }

  const style =
    LEVEL_BADGE_STYLES[levelName.toLowerCase()] || LEVEL_BADGE_STYLES.default;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {levelName}
    </span>
  );
}
