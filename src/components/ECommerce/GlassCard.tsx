import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  glowColor?: 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'none';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

const glowColors = {
  purple: 'border-purple-200/30 dark:border-purple-700/30 shadow-[0_0_8px_rgba(168,85,247,0.08)]',
  blue: 'border-blue-200/30 dark:border-blue-700/30 shadow-[0_0_8px_rgba(59,130,246,0.08)]',
  green: 'border-green-200/30 dark:border-green-700/30 shadow-[0_0_8px_rgba(34,197,94,0.08)]',
  pink: 'border-pink-200/30 dark:border-pink-700/30 shadow-[0_0_8px_rgba(236,72,153,0.08)]',
  orange: 'border-orange-200/30 dark:border-orange-700/30 shadow-[0_0_8px_rgba(249,115,22,0.08)]',
  none: 'border-transparent',
};

const blurIntensities = {
  low: 'backdrop-blur-sm',
  medium: 'backdrop-blur-md',
  high: 'backdrop-blur-xl',
};

export default function GlassCard({
  children,
  glowColor = 'none',
  intensity = 'medium',
  className = '',
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={`
        relative rounded-xl overflow-hidden
        bg-white dark:bg-gray-800
        ${blurIntensities[intensity]}
        ${glowColor !== 'none' ? `border ${glowColors[glowColor]}` : 'border border-gray-200 dark:border-gray-700'}
        shadow-sm hover:shadow-md transition-shadow
        ${className}
      `}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02] dark:to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

