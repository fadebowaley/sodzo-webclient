import { motion } from 'framer-motion';
import { TrendingUp, Flame } from 'lucide-react';
import { Product } from '../../data/mockProducts';
import CreativeProductCard from './CreativeProductCard';
import ThematicZone from './ThematicZone';

interface ZoneTrendingProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ZoneTrending({
  products,
  onProductClick,
  onAddToCart,
}: ZoneTrendingProps) {
  // Sort by rating and get top products
  const trending = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  return (
    <ThematicZone
      title="Trending Now"
      subtitle="Most loved by our community"
      gradient="from-orange-50/30 via-amber-50/15 to-orange-50/30 dark:from-orange-900/10 dark:via-amber-900/5 dark:to-orange-900/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trending.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div className="relative">
              {/* Trending Badge */}
              <motion.div
                className="absolute -top-3 -right-3 z-20 bg-orange-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold shadow-sm"
              >
                <Flame className="w-3 h-3" />
                Hot
              </motion.div>
              <CreativeProductCard
                product={product}
                onAddToCart={onAddToCart}
                onClick={() => onProductClick(product)}
                size="medium"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </ThematicZone>
  );
}

