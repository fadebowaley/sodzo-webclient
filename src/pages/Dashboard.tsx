import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MetricCard from '../components/UI/MetricCard';
import ProjectCard from '../components/UI/ProjectCard';
import ApiKeyStatusBanner from "../components/UI/ApiKeyStatusBanner";
import { mockUser,mockDashboardMetrics, mockProjects, chartData } from '../data/mockData';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useApiKeyStatus } from "../hooks/useApiKeyStatus";

export default function Dashboard() {
  const activeProjects = mockProjects.filter((p) => p.status === "active");
  const recentProjects = mockProjects.slice(0, 3);
  const { user } = useAuth();
  const { isMobile } = useDeviceDetection();
  const { status, loading, shouldShowBanner, refetch } = useApiKeyStatus();

  return (
    <div className="w-full space-y-4 mobile:space-y-4">
      {/* API Key Status Banner */}
      {shouldShowBanner && status && (
        <ApiKeyStatusBanner status={status} onRefresh={refetch} />
      )}
      {/* Header - Hidden on mobile (shown in MobileHeader) */}
      {!isMobile && (
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {user?.firstname} Here's what's happening with your
              projects.
            </p>
          </motion.div>
          <motion.div
            className="mt-4 sm:mt-0 flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4 inline mr-1" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mobile Welcome Message */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Welcome back, {user?.firstname || "User"}!
          </p>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-2 mobile:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 mobile:gap-3 md:gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}>
        {mockDashboardMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isMobile ? { y: -5, scale: 1.02 } : {}}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={isMobile ? "mobile-card floating-animation" : ""}
            style={{ animationDelay: `${index * 0.1}s` }}>
            <MetricCard metric={metric} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-2 gap-4 mobile:gap-4 md:gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}>
        {/* Revenue Chart */}
        <motion.div
          className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mobile:p-4 md:p-6 ${
            isMobile ? "mobile-card-elevated" : "bg-white dark:bg-gray-800"
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={!isMobile ? { scale: 1.02 } : {}}>
          <h3 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 mobile:mb-3 md:mb-4">
            Monthly Revenue
          </h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <BarChart data={chartData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(31 41 55)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Bar dataKey="revenue" fill="#3B82F6" />
                <Bar dataKey="expenses" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Project Status Chart */}
        <motion.div
          className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mobile:p-4 md:p-6 ${
            isMobile ? "mobile-card-elevated" : "bg-white dark:bg-gray-800"
          }`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={!isMobile ? { scale: 1.02 } : {}}>
          <h3 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 mobile:mb-3 md:mb-4">
            Project Status
          </h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <PieChart>
                <Pie
                  data={chartData.projectStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value">
                  {chartData.projectStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(31 41 55)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Recent Activity & Quick Actions */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-3 gap-4 mobile:gap-4 md:gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}>
        {/* Recent Projects */}
        <div className="xl:col-span-2">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mobile:p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                Recent Projects
              </h3>
              <motion.button
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 touch-target px-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                View All
              </motion.button>
            </div>
            <div className="space-y-3 mobile:space-y-3 md:space-y-4">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}>
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4 mobile:space-y-4 md:space-y-6">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mobile:p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}>
            <h3 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 mobile:mb-3 md:mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Completed Tasks
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This week
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  127
                </span>
              </motion.div>

              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Hours Logged
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This week
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  42
                </span>
              </motion.div>

              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 }}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Pending Reviews
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Awaiting action
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  5
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mobile:p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}>
            <h3 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 mobile:mb-3 md:mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <motion.div
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 }}>
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    New comment on Customer Portal
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    2 hours ago
                  </p>
                </div>
              </motion.div>
              <motion.div
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}>
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    Task completed in Analytics Dashboard
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    4 hours ago
                  </p>
                </div>
              </motion.div>
              <motion.div
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}>
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    New file uploaded to Cloud Storage
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    1 day ago
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}