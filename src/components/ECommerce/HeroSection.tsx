import { motion } from 'framer-motion';
import { Product } from '../../data/mockProducts';
import CreativeProductCard from './CreativeProductCard';

interface HeroSectionProps {
  featuredProduct: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function HeroSection({
  featuredProduct,
  onProductClick,
  onAddToCart,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden mb-16">
      {/* Subtle Background Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-indigo-50/20 to-blue-50/40 dark:from-blue-900/10 dark:via-indigo-900/5 dark:to-blue-900/10"
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Discover
              <br />
              <span className="text-blue-600 dark:text-blue-400">Quality Products</span>
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Explore our curated collection of premium digital and physical products
            </motion.p>
          </motion.div>

          {/* Featured Product Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-md">
              <CreativeProductCard
                product={featuredProduct}
                onAddToCart={onAddToCart}
                onClick={() => onProductClick(featuredProduct)}
                size="large"
                variant="featured"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

