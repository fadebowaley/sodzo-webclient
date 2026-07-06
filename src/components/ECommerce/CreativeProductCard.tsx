import { motion } from 'framer-motion';
import { useState } from 'react';
import { ShoppingCart, Star, Download, Package, Sparkles } from 'lucide-react';
import { Product } from '../../data/mockProducts';
import GlassCard from './GlassCard';

interface CreativeProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'featured' | 'compact';
}

export default function CreativeProductCard({
  product,
  onAddToCart,
  onClick,
  size = 'medium',
  variant = 'default',
}: CreativeProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const glowColor = product.type === 'digital' ? 'blue' : 'blue';
  const sizeClasses = {
    small: 'h-64',
    medium: 'h-80',
    large: 'h-96',
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard
        glowColor="blue"
        intensity="low"
        className={`${sizeClasses[size]} overflow-hidden`}
      >
        {/* Product Image with 3D Effect */}
        <div className="relative h-2/3 overflow-hidden">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotateY: isHovered ? 5 : 0,
            }}
            transition={{ duration: 0.4 }}
            style={{ transformStyle: 'preserve-3d' }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {product.featured && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Featured
              </motion.div>
            )}
            {discount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full"
              >
                -{discount}%
              </motion.div>
            )}
          </div>

          {/* Product Type Badge */}
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              className={`px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 ${
                product.type === 'digital'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {product.type === 'digital' ? (
                <Download className="w-4 h-4" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">
                {product.type === 'digital' ? 'Digital' : 'Physical'}
              </span>
            </motion.div>
          </div>

          {/* Shimmer Effect on Hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 h-1/3 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mb-2">
              {product.shortDescription}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Star
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {product.rating}
              </span>
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-xl font-bold text-gray-900 dark:text-white"
                animate={{ scale: isHovered ? 1.1 : 1 }}
              >
                ${product.price.toFixed(2)}
              </motion.span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (product.inStock) {
                  onAddToCart(product);
                }
              }}
              disabled={!product.inStock}
              className={`p-2.5 rounded-lg transition-all ${
                product.inStock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              whileHover={product.inStock ? { scale: 1.1, rotate: 5 } : {}}
              whileTap={product.inStock ? { scale: 0.9 } : {}}
            >
              <ShoppingCart className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

