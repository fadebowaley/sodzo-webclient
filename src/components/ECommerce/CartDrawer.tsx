import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '../../data/mockProducts';
import GlassCard from './GlassCard';
import FloatingPanel from './FloatingPanel';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = items.some((item) => item.product.type === 'physical') ? 9.99 : 0;
  const total = subtotal + tax + shipping;

  return (
    <FloatingPanel
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      className="w-full max-w-2xl"
    >
      <div className="flex flex-col h-[100vh] max-h-screen">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 bg-blue-600 rounded-lg"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Shopping Cart
              </h2>
              {items.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Cart Items - Dashboard Style */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <GlassCard glowColor="blue" className="p-12 max-w-md">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ShoppingCart className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Add some products to get started
                </p>
                <motion.button
                  onClick={onClose}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue Shopping
                </motion.button>
              </GlassCard>
            </motion.div>
          ) : (
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.9 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  layout
                >
                  <GlassCard
                    glowColor="blue"
                    intensity="low"
                    className="p-4 hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex gap-4">
                      {/* Product Image with 3D Effect */}
                      <motion.div
                        className="relative flex-shrink-0"
                        whileHover={{ rotateY: 5, rotateX: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-xl shadow-lg"
                        />
                        {/* Floating Badge */}
                        {item.product.featured && (
                          <motion.div
                            className="absolute -top-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-sm"
                          >
                            <Sparkles className="w-3 h-3" />
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          ${item.product.price.toFixed(2)} each
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold"
                              disabled={item.quantity <= 1}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            <motion.span
                              className="w-16 text-center text-lg font-bold text-gray-900 dark:text-white"
                              key={item.quantity}
                              initial={{ scale: 1.5 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {item.quantity}
                            </motion.span>
                            <motion.button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold"
                              disabled={
                                item.product.type === 'physical' &&
                                item.product.stockQuantity
                                  ? item.quantity >= item.product.stockQuantity
                                  : false
                              }
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>

                          <div className="flex items-center gap-4">
                            <motion.span
                              className="text-xl font-bold text-blue-600 dark:text-blue-400"
                              key={item.product.price * item.quantity}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </motion.span>
                            <motion.button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Summary and Checkout - Sticky Footer */}
        {items.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="border-t border-gray-200/50 dark:border-gray-700/50 p-6 space-y-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl"
          >
            {/* Summary */}
            <GlassCard glowColor="blue" intensity="low" className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between text-base text-gray-700 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-base text-gray-700 dark:text-gray-300">
                    <span>Shipping</span>
                    <span className="font-semibold">${shipping.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base text-gray-700 dark:text-gray-300">
                  <span>Tax</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Checkout Button */}
            <motion.button
              onClick={onCheckout}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-sm"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Proceed to Checkout
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </FloatingPanel>
  );
}
