import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface FloatingPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showCloseButton?: boolean;
  className?: string;
}

const positionVariants = {
  top: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  bottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
  left: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  right: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  center: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
};

export default function FloatingPanel({
  children,
  isOpen,
  onClose,
  position = 'bottom',
  showCloseButton = true,
  className = '',
  ...props
}: FloatingPanelProps) {
  const variants = positionVariants[position];

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              fixed z-50
              ${position === 'top' ? 'top-0 left-0 right-0' : ''}
              ${position === 'bottom' ? 'bottom-0 left-0 right-0' : ''}
              ${position === 'left' ? 'left-0 top-0 bottom-0' : ''}
              ${position === 'right' ? 'right-0 top-0 bottom-0 h-screen' : ''}
              ${position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
              ${className}
            `}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50">
              {showCloseButton && onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

