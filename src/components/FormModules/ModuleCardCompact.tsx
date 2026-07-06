import { motion } from "framer-motion";
import { LucideIcon, FileText, BarChart3, ChevronRight } from "lucide-react";

interface ModuleCardCompactProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category?: string;
  fields?: number;
  submissions?: number;
  lastUsed?: string;
  onClick: () => void;
  index?: number;
  variant?: "compact" | "minimal" | "icon";
}

export default function ModuleCardCompact({
  id,
  name,
  description,
  icon: Icon,
  color,
  category,
  fields,
  submissions,
  lastUsed,
  onClick,
  index = 0,
  variant = "compact",
}: ModuleCardCompactProps) {
  // Minimal variant - horizontal layout
  if (variant === "minimal") {
    return (
      <motion.div
        key={id}
        className="group relative cursor-pointer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          
            {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {name}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300">
                    {category}
                  </span>
                )}
                <ChevronRight 
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-60" 
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                  {description}
                </p>
              )}
              {(fields !== undefined || submissions !== undefined) && (
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {fields !== undefined && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {fields}
                    </span>
                  )}
                  {submissions !== undefined && (
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {submissions}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Icon variant - square icon cards
  if (variant === "icon") {
    return (
      <motion.div
        key={id}
        className="group relative cursor-pointer"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}>
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 aspect-square">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${color} mb-3 group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          {/* Title */}
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white text-center mb-1 line-clamp-1">
            {name}
          </h3>
          
          {/* Stats */}
          {(fields !== undefined || submissions !== undefined) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {submissions !== undefined ? submissions : fields}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Compact variant - icon on side, text in front (default)
  return (
    <motion.div
      key={id}
      className="group relative cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}>
      {/* Glass Card - Compact */}
      <div className="relative h-full rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-xl" />
        
        {/* Content - Flex layout with icon on side */}
        <div className="relative z-10 flex h-full">
          {/* Icon Column - Left Side */}
          <div className={`flex items-center justify-center p-4 ${color} min-w-[80px] w-20 flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          
          {/* Text Content - Right Side (Front) */}
          <div className="flex-1 flex flex-col justify-between p-4 min-w-0">
            {/* Header with Category */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {description}
                </p>
              </div>
              {category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 backdrop-blur-sm ml-2 flex-shrink-0">
                  {category}
                </span>
              )}
            </div>

            {/* Stats - Bottom */}
            <div className="flex items-center justify-between mt-auto">
              {(fields !== undefined || submissions !== undefined) ? (
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {fields !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-medium">{fields}</span>
                      <span className="text-gray-400 dark:text-gray-500">fields</span>
                    </div>
                  )}
                  {submissions !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="font-medium">{submissions}</span>
                      <span className="text-gray-400 dark:text-gray-500">submissions</span>
                    </div>
                  )}
                </div>
              ) : (
                <div></div>
              )}
              {/* Arrow icon - appears on hover */}
              <ChevronRight 
                className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-60 transition-opacity duration-200 flex-shrink-0" 
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl" />
        </div>
      </div>
    </motion.div>
  );
}

