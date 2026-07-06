import { motion } from "framer-motion";
import { LucideIcon, FileText, BarChart3, ChevronRight } from "lucide-react";

interface ModuleCardProps {
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
}

export default function ModuleCard({
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
}: ModuleCardProps) {
  return (
    <motion.div
      key={id}
      className="group relative cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}>
      {/* Glass Card */}
      <div className="relative h-full rounded-2xl p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-2xl" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            {/* Icon */}
            <div className={`p-3 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            {/* Category Badge */}
            {category && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 backdrop-blur-sm">
                {category}
              </span>
            )}
          </div>

          {/* Title and Description */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Stats */}
          {(fields !== undefined || submissions !== undefined) && (
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-4">
                {fields !== undefined && (
                  <div className="flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    <span>{fields} fields</span>
                  </div>
                )}
                {submissions !== undefined && (
                  <div className="flex items-center">
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    <span>{submissions}</span>
                  </div>
                )}
              </div>
              {/* Arrow icon - appears on hover */}
              <ChevronRight 
                className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-60 transition-opacity duration-200 flex-shrink-0" 
                aria-hidden="true"
              />
            </div>
          )}
          {/* Arrow for cards without stats */}
          {(!fields && !submissions) && (
            <div className="flex justify-end mt-4">
              <ChevronRight 
                className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-60 transition-opacity duration-200" 
                aria-hidden="true"
              />
            </div>
          )}

          {/* Last Used */}
          {lastUsed && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(lastUsed).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-xl" />
        </div>
      </div>
    </motion.div>
  );
}

