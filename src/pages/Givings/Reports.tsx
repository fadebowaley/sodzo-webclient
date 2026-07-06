import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Filter,
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import {
  mockDonations,
  mockDonationAnalytics,
  donationCategories,
  paymentMethods,
} from '../../data/mockDonations';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const analytics = mockDonationAnalytics;

  // Filter donations based on selected filters
  const filteredDonations = mockDonations.filter((donation) => {
    if (categoryFilter !== 'all' && donation.category.id !== categoryFilter) {
      return false;
    }
    if (methodFilter !== 'all' && donation.paymentMethod.id !== methodFilter) {
      return false;
    }
    return true;
  });

  const chartData = dateFilter === 'daily' 
    ? analytics.dailyBreakdown.slice(-7) // Last 7 days
    : dateFilter === 'weekly'
    ? analytics.weeklyBreakdown.slice(-4) // Last 4 weeks
    : analytics.monthlyBreakdown.slice(-6); // Last 6 months

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Export started!');
  };

  return (
    <div className="w-full space-y-6 mobile:space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/givings')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Donations Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Analytics and insights for all donations
            </p>
          </div>
        </div>
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-4
          `}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{analytics.totalToday.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-4
          `}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">This Week</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{analytics.totalThisWeek.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-4
          `}>
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{analytics.totalThisMonth.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-4
          `}>
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">This Year</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{analytics.totalThisYear.toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`
          ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
          p-4
        `}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Categories</option>
              {donationCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-6
          `}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Donations Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={dateFilter === 'daily' ? 'date' : dateFilter === 'weekly' ? 'week' : 'month'}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Amount (₦)"
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={2}
                name="Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* By Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-6
          `}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            By Payment Method
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.byMethod}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount">
                {analytics.byMethod.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `₦${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* By Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-6
          `}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            By Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="category"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                formatter={(value: number) => `₦${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Contributors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`
            ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
            p-6
          `}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Contributors
          </h3>
          <div className="space-y-3">
            {analytics.topContributors.map((contributor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {contributor.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {contributor.count} donations
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  ₦{contributor.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Donations History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className={`
          ${isMobile ? 'mobile-card' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'}
          p-6
        `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Donations History
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredDonations.length} donations
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Donor
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Method
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.slice(0, 20).map((donation) => (
                <tr
                  key={donation.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {donation.donorName}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {donation.category.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {donation.paymentMethod.name}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                    ₦{donation.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {donation.date.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        donation.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : donation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* TODO: Add pagination when backend is integrated */}
      </motion.div>
    </div>
  );
}

