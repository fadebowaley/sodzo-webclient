import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, X, Sparkles, Filter } from 'lucide-react';
import { mockProducts, Product } from '../data/mockProducts';
import ProductDetailModal from '../components/ECommerce/ProductDetailModal';
import CartDrawer, { CartItem } from '../components/ECommerce/CartDrawer';
import CheckoutFlow from '../components/ECommerce/CheckoutFlow';
import HeroSection from '../components/ECommerce/HeroSection';
import ZoneNewArrivals from '../components/ECommerce/ZoneNewArrivals';
import ZoneTrending from '../components/ECommerce/ZoneTrending';
import ZoneAllProducts from '../components/ECommerce/ZoneAllProducts';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import toast from 'react-hot-toast';
import GlassCard from '../components/ECommerce/GlassCard';

type FilterType = 'all' | 'digital' | 'physical';

export default function ECommerce() {
  const { isMobile } = useDeviceDetection();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(mockProducts.map((p) => p.category))];
    return cats;
  }, []);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        filterType === 'all' || product.type === filterType;

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [searchQuery, filterType, selectedCategory]);

  // Get featured product for hero
  const featuredProduct = useMemo(() => {
    return mockProducts.find((p) => p.featured) || mockProducts[0];
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    if (!cartOpen) {
      setCartOpen(true);
    }
    toast.success(`${product.name} added to cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    toast.success('Item removed from cart');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductDetailOpen(true);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleCheckoutComplete = () => {
    setCartItems([]);
    toast.success('Order placed successfully!');
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic background gradient based on selected category - toned down
  const getCategoryGradient = () => {
    if (selectedCategory === 'all') return 'from-gray-50/50 via-blue-50/30 to-gray-50/50 dark:from-gray-900/50 dark:via-blue-900/10 dark:to-gray-900/50';
    const gradients: Record<string, string> = {
      'Education': 'from-blue-50/40 via-indigo-50/20 to-blue-50/40 dark:from-blue-900/10 dark:via-indigo-900/5 dark:to-blue-900/10',
      'Electronics': 'from-green-50/40 via-emerald-50/20 to-green-50/40 dark:from-green-900/10 dark:via-emerald-900/5 dark:to-green-900/10',
      'Books': 'from-orange-50/40 via-amber-50/20 to-orange-50/40 dark:from-orange-900/10 dark:via-amber-900/5 dark:to-orange-900/10',
      'Software': 'from-blue-50/40 via-indigo-50/20 to-blue-50/40 dark:from-blue-900/10 dark:via-indigo-900/5 dark:to-blue-900/10',
      'Accessories': 'from-gray-50/40 via-blue-50/20 to-gray-50/40 dark:from-gray-900/10 dark:via-blue-900/5 dark:to-gray-900/10',
      'Design': 'from-purple-50/40 via-pink-50/20 to-purple-50/40 dark:from-purple-900/10 dark:via-pink-900/5 dark:to-purple-900/10',
      'Furniture': 'from-amber-50/40 via-orange-50/20 to-amber-50/40 dark:from-amber-900/10 dark:via-orange-900/5 dark:to-amber-900/10',
    };
    return gradients[selectedCategory] || 'from-gray-50/50 via-blue-50/30 to-gray-50/50 dark:from-gray-900/50 dark:via-blue-900/10 dark:to-gray-900/50';
  };

  return (
    <div className="relative min-h-screen">
      {/* Subtle Dynamic Background */}
      <motion.div
        className={`fixed inset-0 bg-gradient-to-br ${getCategoryGradient()} -z-10 transition-all duration-1000`}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8">
        {/* Floating Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-40 mb-8"
        >
          <GlassCard glowColor="blue" intensity="high" className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters Toggle (Mobile) */}
              {isMobile && (
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Filter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>
              )}

              {/* Cart Button */}
              <motion.button
                onClick={() => setCartOpen(true)}
                className="relative p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart className="w-5 h-5" />
                {!isMobile && <span className="font-semibold">Cart</span>}
                {cartItemCount > 0 && (
                  <motion.span
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </motion.button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {(showFilters || !isMobile) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-4 pt-4 border-t border-white/20 dark:border-gray-700/50"
                >
                  <div className="flex flex-wrap gap-3">
                    {/* Type Filter */}
                    <div className="flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-lg p-1">
                      {(['all', 'digital', 'physical'] as FilterType[]).map((type) => (
                        <motion.button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            filterType === type
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </motion.button>
                      ))}
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {categories.map((category) => (
                        <motion.button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedCategory === category
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* Main Content */}
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <GlassCard glowColor="blue" className="p-12 max-w-md">
              <Filter className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <div className="space-y-16 md:space-y-24">
            {/* Hero Section with Featured Product */}
            {!searchQuery && filterType === 'all' && selectedCategory === 'all' && (
              <HeroSection
                featuredProduct={featuredProduct}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
              />
            )}

            {/* New Arrivals Zone */}
            {!searchQuery && filterType === 'all' && selectedCategory === 'all' && (
              <ZoneNewArrivals
                products={filteredProducts}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
              />
            )}

            {/* Trending Zone */}
            {!searchQuery && filterType === 'all' && selectedCategory === 'all' && (
              <ZoneTrending
                products={filteredProducts}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
              />
            )}

            {/* All Products Zone (or Filtered Results) */}
            <ZoneAllProducts
              products={filteredProducts}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
            />

            {/* Results Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-600 dark:text-gray-400 pb-8"
            >
              Showing {filteredProducts.length} of {mockProducts.length} products
            </motion.div>
          </div>
        )}
      </div>

      {/* Modals and Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={productDetailOpen}
        onClose={() => {
          setProductDetailOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      <CheckoutFlow
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cartItems}
        onComplete={handleCheckoutComplete}
      />
    </div>
  );
}
