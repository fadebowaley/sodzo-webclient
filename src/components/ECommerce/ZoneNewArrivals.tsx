import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '../../data/mockProducts';
import CreativeProductCard from './CreativeProductCard';
import ThematicZone from './ThematicZone';

interface ZoneNewArrivalsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ZoneNewArrivals({
  products,
  onProductClick,
  onAddToCart,
}: ZoneNewArrivalsProps) {
  const newArrivals = products.filter((p) => !p.featured).slice(0, 6);

  return (
    <ThematicZone
      title="New Arrivals"
      subtitle="Fresh additions to our collection"
      gradient="from-green-50/30 via-emerald-50/15 to-green-50/30 dark:from-green-900/10 dark:via-emerald-900/5 dark:to-green-900/10"
    >
      <div className="relative">
        {/* Horizontal Scrolling Container */}
        <div className="overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-6 min-w-max px-2">
            {newArrivals.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-shrink-0 w-72"
              >
                <CreativeProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onClick={() => onProductClick(product)}
                  size="medium"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="flex items-center justify-center mt-6 gap-2 text-sm text-gray-600 dark:text-gray-400"
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>Swipe to explore</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
    </ThematicZone>
  );
}

