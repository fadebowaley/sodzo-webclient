import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { X, ShoppingCart, Star, Download, Package, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Product } from '../../data/mockProducts';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScrollY(0);
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [isOpen]);

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const themeColor = 'blue';
  const themeGradient = product.type === 'digital'
    ? 'from-blue-50/50 via-indigo-50/30 to-blue-50/50 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-blue-900/20'
    : 'from-green-50/50 via-emerald-50/30 to-green-50/50 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-green-900/20';

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('This product is out of stock');
      return;
    }
    onAddToCart(product, quantity);
    toast.success(`${quantity} ${product.name} added to cart`);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Theme Color */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 z-50 bg-gradient-to-br ${themeGradient} backdrop-blur-md`}
            onClick={onClose}
          />

          {/* Full-Bleed Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-screen flex flex-col lg:flex-row">
              {/* Full-Bleed Image Gallery (Left Side) */}
              <motion.div
                className="relative w-full lg:w-1/2 min-h-screen lg:sticky lg:top-0"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Parallax Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />

                {/* Main Image */}
                <div className="relative h-screen flex items-center justify-center p-8 lg:p-16">
                  <motion.img
                    key={selectedImageIndex}
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-2xl shadow-2xl"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Image Navigation */}
                  {product.images.length > 1 && (
                    <>
                      <motion.button
                        onClick={prevImage}
                        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all z-10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </motion.button>
                      <motion.button
                        onClick={nextImage}
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all z-10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.button>
                    </>
                  )}

                  {/* Image Indicators */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {product.images.map((_, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === selectedImageIndex
                              ? 'w-8 bg-white'
                              : 'w-2 bg-white/50 hover:bg-white/75'
                          }`}
                          whileHover={{ scale: 1.2 }}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Close Button */}
                  <motion.button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all z-20"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {product.images.map((image, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-white shadow-lg shadow-white/50 scale-110'
                              : 'border-white/30 hover:border-white/60'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Sticky Product Info Panel (Right Side) */}
              <motion.div
                className="w-full lg:w-1/2 bg-white dark:bg-gray-900 min-h-screen"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="sticky top-0 p-8 lg:p-12 max-h-screen overflow-y-auto">
                  {/* Header with Badges */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <GlassCard
                        glowColor={themeColor}
                        intensity="medium"
                        className="px-4 py-2 inline-block"
                      >
                        <div className="flex items-center gap-2">
                          {product.type === 'digital' ? (
                            <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {product.type === 'digital' ? 'Digital' : 'Physical'}
                          </span>
                        </div>
                      </GlassCard>
                      {product.featured && (
                        <motion.div
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Featured
                        </motion.div>
                      )}
                      {discount > 0 && (
                        <motion.div
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          -{discount}% OFF
                        </motion.div>
                      )}
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                      {product.name}
                    </h1>

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          </motion.div>
                        ))}
                      </div>
                      <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                        {product.rating} ({product.reviewCount} reviews)
                      </span>
                    </div>
                  </motion.div>

                  {/* Price Section */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                  >
                    <div className="flex items-baseline gap-4 mb-3">
                      <motion.span
                        className="text-5xl font-bold text-blue-600 dark:text-blue-400"
                      >
                        ${product.price.toFixed(2)}
                      </motion.span>
                      {product.originalPrice && (
                        <>
                          <span className="text-2xl text-gray-500 dark:text-gray-400 line-through">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Stock Status */}
                    {product.type === 'physical' && product.stockQuantity && (
                      <div className="text-base">
                        {product.inStock ? (
                          product.stockQuantity < 10 ? (
                            <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-2">
                              <Check className="w-5 h-5" />
                              Only {product.stockQuantity} left in stock
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                              <Check className="w-5 h-5" />
                              In Stock
                            </span>
                          )
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    )}
                    {product.type === 'digital' && (
                      <div className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Available for immediate download
                      </div>
                    )}
                  </motion.div>

                  {/* Description with Scroll Reveal */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mb-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Description
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                      {product.description}
                    </p>
                    {/* Tags */}
                    {product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <motion.span
                            key={tag}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Quantity and Add to Cart - Sticky at Bottom */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-auto"
                  >
                    {product.type === 'physical' && (
                      <div className="mb-6">
                        <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Quantity
                        </label>
                        <div className="flex items-center gap-4">
                          <motion.button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold text-lg"
                            disabled={quantity <= 1}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            −
                          </motion.button>
                          <span className="w-20 text-center text-2xl font-bold text-gray-900 dark:text-white">
                            {quantity}
                          </span>
                          <motion.button
                            onClick={() => setQuantity((q) => q + 1)}
                            className="w-12 h-12 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold text-lg"
                            disabled={product.stockQuantity ? quantity >= product.stockQuantity : false}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            +
                          </motion.button>
                        </div>
                      </div>
                    )}
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className={`w-full py-4 px-8 rounded-lg font-semibold text-lg text-white transition-all flex items-center justify-center gap-3 ${
                        product.inStock
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                          : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      }`}
                      whileHover={product.inStock ? { scale: 1.02, y: -2 } : {}}
                      whileTap={product.inStock ? { scale: 0.98 } : {}}
                    >
                      <ShoppingCart className="w-6 h-6" />
                      {product.inStock
                        ? product.type === 'digital'
                          ? 'Add to Cart'
                          : `Add ${quantity} to Cart`
                        : 'Out of Stock'}
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
