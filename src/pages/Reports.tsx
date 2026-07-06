import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../contexts/AuthContext";
import { Trophy, Shield, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useUserNode } from "../hooks/useUserNode";
import { motion } from "framer-motion";

interface LeaderBoardUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  score?: number;
  rank?: number;
  role?: string;
  avatar?: string;
}

interface ComplianceRecord {
  id: string;
  userId: string;
  userName: string;
  complianceType: string;
  status: "Compliant" | "Non-Compliant" | "Pending";
  lastUpdated: string;
  notes?: string;
}

export default function Reports() {
  const { api, logout, user } = useAuth();
  const { isMobile } = useDeviceDetection();
  const { nodeId: userNodeId } = useUserNode();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "compliance">(
    "leaderboard"
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const userId = user?.id;
  const isOwner = Boolean(user?.isOwner || user?.isSuper);

  const { data: modules = [] } = useQuery({
    queryKey: ["report-modules"],
    queryFn: async () => {
      const res = await api.get("/project-forms");
      const results = res.data?.results || [];
      return results.map((module: any) => ({
        projectId: module.projectId,
        projectName:
          module.configuration?.projectName ||
          module.projectName ||
          module.projectId,
      }));
    },
    enabled: activeTab === "compliance",
  });

  const {
    data: moduleTable,
    isLoading: moduleTableLoading,
    error: moduleTableError,
  } = useQuery({
    queryKey: ["module-table", selectedProjectId, userNodeId, isOwner],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const params: Record<string, string> = {
        project_id: selectedProjectId,
      };
      if (!isOwner && userNodeId) {
        params.node_id = userNodeId;
      }
      const res = await api.get("/submission-reports/module-table", { params });
      return res.data;
    },
    enabled: activeTab === "compliance" && !!selectedProjectId,
  });

  useEffect(() => {
    if (!selectedProjectId && modules.length > 0) {
      setSelectedProjectId(modules[0].projectId);
    }
  }, [modules, selectedProjectId]);

  // Fetch leaderboard data using React Query
  const {
    data: leaderboard = [],
    isLoading: leaderboardLoading,
    error: leaderboardError,
  } = useQuery({
    queryKey: ["leaderboard", userId],
    queryFn: async () => {
      if (!userId) return [];

      // TODO: Replace with actual leaderboard endpoint when available
      // For now, this is a placeholder - you'll need to create this endpoint
      // const res = await api.get(`/reports/leaderboard`);
      // return res.data?.results || res.data || [];

      // Placeholder: return empty array
      return [];
    },
    enabled: activeTab === "leaderboard" && !!userId,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
        return false;
      }
      return failureCount < 2; // Retry up to 2 times
    },
  });

  // Fetch compliance data using React Query
  const {
    data: compliance = [],
    isLoading: complianceLoading,
    error: complianceError,
  } = useQuery({
    queryKey: ["compliance", userId],
    queryFn: async () => {
      if (!userId) return [];

      // TODO: Replace with actual compliance endpoint when available
      // For now, this is a placeholder - you'll need to create this endpoint
      // const res = await api.get(`/reports/compliance`);
      // return res.data?.results || res.data || [];

      // Placeholder: return empty array
      return [];
    },
    enabled: activeTab === "compliance" && !!userId,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
        return false;
      }
      return failureCount < 2; // Retry up to 2 times
    },
  });

  // Determine loading state based on active tab
  const loading =
    activeTab === "leaderboard" ? leaderboardLoading : complianceLoading;

  // Handle errors
  if (leaderboardError && activeTab === "leaderboard") {
    const axiosError = leaderboardError as any;
    if (axiosError.response?.status !== 401) {
      toast.error("Failed to load leaderboard");
      console.error("Leaderboard fetch error:", leaderboardError);
    }
  }

  if (complianceError && activeTab === "compliance") {
    const axiosError = complianceError as any;
    if (axiosError.response?.status !== 401) {
      toast.error("Failed to load compliance data");
      console.error("Compliance fetch error:", complianceError);
    }
  }

  const tabs = [
    {
      id: "leaderboard" as const,
      name: "LeaderBoard",
      icon: Trophy,
      description: "User rankings and scores",
    },
    {
      id: "compliance" as const,
      name: "Compliance",
      icon: Shield,
      description: "Compliance reporting and status",
    },
  ];

  const getStatusBadge = (status: ComplianceRecord["status"]) => {
    const styles = {
      Compliant:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      "Non-Compliant":
        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      Pending:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    };
    return styles[status];
  };

  return (
    <div className="space-y-4 mobile:space-y-4 md:space-y-6">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            View reports and analytics
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto -mx-4 mobile:-mx-4 md:mx-0 px-4 mobile:px-4 md:px-0">
        <nav className="-mb-px flex space-x-4 mobile:space-x-4 md:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 mobile:py-2.5 md:py-2 px-2 mobile:px-2 md:px-1 border-b-2 font-medium text-sm mobile:text-sm transition-colors flex items-center space-x-2 touch-target whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}>
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div
        className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
          isMobile ? "mobile-card-elevated" : "bg-white dark:bg-gray-800"
        }`}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading{" "}
              {activeTab === "leaderboard" ? "leaderboard" : "compliance"}...
            </span>
          </div>
        ) : (
          <>
            {/* LeaderBoard Tab */}
            {activeTab === "leaderboard" && (
              <div className="p-4 mobile:p-4 md:p-6">
                {!isMobile && (
                  <div className="mb-4 mobile:mb-4 md:mb-6">
                    <h2 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      LeaderBoard
                    </h2>
                    <p className="text-xs mobile:text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      User rankings and performance scores
                    </p>
                  </div>
                )}

                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 mobile:py-8 md:py-12">
                    <Trophy className="w-12 h-12 mobile:w-12 mobile:h-12 md:w-16 md:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-sm mobile:text-sm md:text-base text-gray-500 dark:text-gray-400">
                      No leaderboard data available
                    </p>
                    <p className="text-xs mobile:text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Leaderboard will appear here when data is available
                    </p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View */
                  <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <motion.div
                        key={user.id}
                        className="mobile-card rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50 floating-animation"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {index < 3 ? (
                              <Trophy
                                className={`w-5 h-5 ${
                                  index === 0
                                    ? "text-yellow-500"
                                    : index === 1
                                    ? "text-gray-400"
                                    : "text-orange-600"
                                }`}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-6">
                                #{user.rank || index + 1}
                              </span>
                            )}
                            {user.avatar && (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.avatar}
                                alt={`${user.firstname} ${user.lastname}`}
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstname} {user.lastname}
                              </p>
                              {user.role && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.role}
                                </p>
                              )}
                            </div>
                          </div>
                          {user.score !== undefined && (
                            <div className="text-right">
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {user.score}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Score
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {leaderboard.map((user, index) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index < 3 ? (
                                  <Trophy
                                    className={`w-5 h-5 ${
                                      index === 0
                                        ? "text-yellow-500"
                                        : index === 1
                                        ? "text-gray-400"
                                        : "text-orange-600"
                                    }`}
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    #{user.rank || index + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.avatar && (
                                  <img
                                    className="h-10 w-10 rounded-full mr-3"
                                    src={user.avatar}
                                    alt={`${user.firstname} ${user.lastname}`}
                                  />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.firstname} {user.lastname}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {user.role || "Member"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.score || 0}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === "compliance" && (
              <div className="p-4 mobile:p-4 md:p-6">
                {!isMobile && (
                  <div className="mb-4 mobile:mb-4 md:mb-6">
                    <h2 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Compliance
                    </h2>
                    <p className="text-xs mobile:text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      Compliance reporting and status tracking
                    </p>
                  </div>
                )}

                <div className="mb-4 space-y-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Select Module
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="">Select module</option>
                    {modules.map((module: any) => (
                      <option key={module.projectId} value={module.projectId}>
                        {module.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                {moduleTableError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {(moduleTableError as any)?.response?.data?.message ||
                      "Failed to load module report table"}
                  </div>
                ) : moduleTableLoading ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    Loading module report table...
                  </div>
                ) : moduleTable?.rows?.length ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {(moduleTable.columns || []).map((column: any) => (
                            <th
                              key={column.key}
                              className="whitespace-nowrap border-b px-3 py-2 text-left font-semibold text-gray-700"
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {moduleTable.rows.map((row: any, idx: number) => (
                          <tr key={`${row.submission_id || idx}`} className="border-b">
                            {(moduleTable.columns || []).map((column: any) => (
                              <td
                                key={`${row.submission_id || idx}-${column.key}`}
                                className="whitespace-nowrap px-3 py-2 text-gray-700"
                              >
                                {row[column.key] === null || row[column.key] === undefined
                                  ? "—"
                                  : String(row[column.key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 mobile:py-8 md:py-12">
                    <Shield className="w-12 h-12 mobile:w-12 mobile:h-12 md:w-16 md:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-sm mobile:text-sm md:text-base text-gray-500 dark:text-gray-400">
                      No module report data available
                    </p>
                    <p className="text-xs mobile:text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Submit module data to populate report rows
                    </p>
                  </div>
                )}

                {/* legacy compliance cards/table retained below */}
                {compliance.length > 0 && isMobile ? (
                  /* Mobile Card View */
                  <div className="space-y-3">
                    {compliance.map((record, index) => (
                      <motion.div
                        key={record.id}
                        className="mobile-card rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50 floating-animation"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {record.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {record.complianceType}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ml-2 ${getStatusBadge(
                              record.status
                            )}`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                              Last Updated:
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(
                                record.lastUpdated
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {record.notes && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 pt-1">
                              <span className="font-medium">Notes: </span>
                              <span className="line-clamp-2">
                                {record.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {compliance.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {record.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {record.complianceType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                                  record.status
                                )}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(
                                record.lastUpdated
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {record.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
