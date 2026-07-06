import { motion } from 'framer-motion';
import { ShoppingCart, Star, Download, Package } from 'lucide-react';
import { Product } from '../../data/mockProducts';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: () => void;
}

export default function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md">
              Featured
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-md">
              -{discount}%
            </span>
          )}
        </div>
        {/* Product Type Badge */}
        <div className="absolute top-3 right-3">
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${
            product.type === 'digital'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {product.type === 'digital' ? (
              <Download className="w-3 h-3 inline mr-1" />
            ) : (
              <Package className="w-3 h-3 inline mr-1" />
            )}
            {product.type === 'digital' ? 'Digital' : 'Physical'}
          </div>
        </div>
        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 bg-gray-800 text-white text-sm font-semibold rounded-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {product.shortDescription}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
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
            className={`p-2 rounded-lg transition-colors ${
              product.inStock
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            whileHover={product.inStock ? { scale: 1.05 } : {}}
            whileTap={product.inStock ? { scale: 0.95 } : {}}
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Stock Info for Physical Products */}
        {product.type === 'physical' && product.inStock && product.stockQuantity && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {product.stockQuantity < 10 ? (
              <span className="text-orange-600 dark:text-orange-400">
                Only {product.stockQuantity} left in stock
              </span>
            ) : (
              <span>In Stock</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

