import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ThematicZoneProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  gradient?: string;
  className?: string;
  delay?: number;
}

export default function ThematicZone({
  children,
  title,
  subtitle,
  gradient = 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
  className = '',
  delay = 0,
}: ThematicZoneProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      className={`relative py-12 md:py-16 lg:py-20 ${className}`}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Subtle Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 dark:opacity-10 rounded-2xl -z-10`} />

      {/* Content */}
      <div className="relative z-10">
        {(title || subtitle) && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, delay }}
            className="mb-8 md:mb-12 text-center"
          >
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: delay + 0.2,
              },
            },
          }}
        >
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
}

