import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Link as LinkIcon,
  QrCode,
  Building2,
  Phone,
  Heart,
  Gift,
  HandHeart,
  Globe,
  Building,
  Sprout,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import {
  donationCategories,
  paymentMethods,
  mockDonations,
  mockDonationAnalytics,
} from '../data/mockDonations';
import toast from 'react-hot-toast';

// Floating card component with 3D effect
const FloatingCard = ({ children, delay = 0, className = '' }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0));
  const rotateY = useSpring(useMotionValue(0));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateXValue = (e.clientY - centerY) / 10;
    const rotateYValue = (centerX - e.clientX) / 10;

    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={className}>
      {children}
    </motion.div>
  );
};

// Animated counter component
const AnimatedCounter = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setDisplayValue(Math.floor(value * progress));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export default function Givings() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const analytics = mockDonationAnalytics;
  const recentDonations = mockDonations.slice(0, 6);

  const quickActions = [
    {
      id: 'link',
      name: 'Payment Link',
      description: 'Create shareable links',
      icon: LinkIcon,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      href: '/givings/payment-link',
      delay: 0.1,
    },
    {
      id: 'qr',
      name: 'QR Code',
      description: 'Generate QR codes',
      icon: QrCode,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      href: '/givings/qr-code',
      delay: 0.2,
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'View accounts',
      icon: Building2,
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      href: '/givings/bank-transfer',
      delay: 0.3,
    },
    {
      id: 'ussd',
      name: 'USSD Code',
      description: 'Mobile banking',
      icon: Phone,
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      href: '/givings/ussd',
      delay: 0.4,
    },
  ];

  const categoryIcons: Record<string, any> = {
    Heart,
    Gift,
    HandHeart,
    Globe,
    Building,
    Sprout,
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 space-y-8 pb-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative pt-8 pb-12">
          {/* Floating decorative elements */}
          <motion.div
            className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-40 left-10 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          <div className="relative z-10">
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center justify-between mb-8">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Givings & Donations
                    </h1>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-gray-600 dark:text-gray-300 ml-16">
                    Transform lives through giving • Every contribution makes a difference
                  </motion.p>
                </div>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/givings/reports')}
                  className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    View Analytics
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </motion.div>
            )}

            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Givings & Donations
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Transform lives through giving
                </p>
              </motion.div>
            )}

            {/* Quick Actions - Floating Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <FloatingCard key={action.id} delay={action.delay}>
                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(action.href)}
                      className="group relative h-full min-h-[180px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 cursor-pointer border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                      {/* Gradient Background */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      />
                      {/* Shimmer Effect */}
                      <motion.div
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                      {/* Content */}
                      <div className="relative z-10">
                        <motion.div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}>
                          <Icon className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {action.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                          {action.description}
                        </p>
                        <motion.div
                          className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                          whileHover={{ x: 5 }}>
                          <span>Get Started</span>
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </div>
                      {/* Decorative corner */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full" />
                    </motion.div>
                  </FloatingCard>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* Live Stats Section - Asymmetric Layout */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Today's Total - Large Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="md:col-span-2 lg:col-span-1 relative group">
              <div className="relative h-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-8 shadow-2xl overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                  }}
                  animate={{ x: [0, 60, 0] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-white/90" />
                    <Sparkles className="w-6 h-6 text-white/70" />
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-2">Today's Total</p>
                  <p className="text-4xl font-bold text-white mb-1">
                    ₦<AnimatedCounter value={analytics.totalToday} />
                  </p>
                  <motion.div
                    className="flex items-center gap-2 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}>
                    <Activity className="w-4 h-4 text-white/80" />
                    <span className="text-white/70 text-xs">Live updates</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Weekly Total */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="relative group">
              <div className="relative h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="relative z-10">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">This Week</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₦<AnimatedCounter value={analytics.totalThisWeek} />
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Monthly Total */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="relative group">
              <div className="relative h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                />
                <div className="relative z-10">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₦<AnimatedCounter value={analytics.totalThisMonth} />
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Top Method */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="relative group">
              <div className="relative h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-2xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
                <div className="relative z-10">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">Top Method</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {analytics.byMethod[0]?.method || 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Donation Categories - Asymmetric Staggered Layout */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ways to Give
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a category that resonates with your heart
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {donationCategories.map((category, index) => {
              const Icon = categoryIcons[category.icon] || Gift;
              const categoryTotal = analytics.byCategory.find(
                (c) => c.category === category.name
              )?.amount || 0;
              const isHovered = hoveredCategory === category.id;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30, rotateY: -15 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onHoverStart={() => setHoveredCategory(category.id)}
                  onHoverEnd={() => setHoveredCategory(null)}
                  whileHover={{ y: -12, scale: 1.05, rotateY: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    // TODO: Navigate to category detail page or show modal
                  }}>
                  <div className="relative h-full min-h-[200px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                    {/* Animated gradient background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    />
                    {/* Floating particles on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"
                              initial={{
                                x: '50%',
                                y: '50%',
                                scale: 0,
                                opacity: 0,
                              }}
                              animate={{
                                x: `${50 + (Math.random() - 0.5) * 100}%`,
                                y: `${50 + (Math.random() - 0.5) * 100}%`,
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0],
                              }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{
                                duration: 2,
                                delay: i * 0.1,
                                repeat: Infinity,
                              }}
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>

                    <div className="relative z-10">
                      <motion.div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}>
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {category.description}
                      </p>
                      <motion.div
                        className="flex items-baseline gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}>
                        <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₦<AnimatedCounter value={categoryTotal} />
                        </p>
                      </motion.div>
                    </div>
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Recent Donations - Layered Cards */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Recent Impact
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                See how your community is making a difference
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/givings/reports')}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl hover:shadow-lg transition-all">
              <span className="text-sm font-medium text-gray-900 dark:text-white">View All</span>
              <ArrowRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {recentDonations.map((donation, index) => {
              const Icon = categoryIcons[donation.category.icon] || Gift;
              return (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                  {/* Gradient accent */}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${donation.category.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${donation.category.color} flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}>
                        <Icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {donation.donorName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {donation.category.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {donation.paymentMethod.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₦{donation.amount.toLocaleString()}
                      </p>
                    </div>
                    <motion.div
                      className="text-xs text-gray-400 dark:text-gray-500"
                      whileHover={{ scale: 1.1 }}>
                      {donation.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Top Contributors - Leaderboard Style */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="relative">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Top Contributors
              </h2>
            </div>
            <div className="space-y-3">
              {analytics.topContributors.map((contributor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  whileHover={{ x: 8, scale: 1.02 }}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/30 rounded-xl hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}>
                      {index + 1}
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {contributor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {contributor.count} donations
                      </p>
                    </div>
                  </div>
                  <motion.div
                    className="text-right"
                    whileHover={{ scale: 1.05 }}>
                    <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ₦{contributor.amount.toLocaleString()}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
