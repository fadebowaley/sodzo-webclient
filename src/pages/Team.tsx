import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Search,
  Mail,
  User,
  Clock,
  CheckCircle,
  Filter,
  Users,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

type MemberStatus = "active" | "invited" | "pending";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: MemberStatus;
  role?: string;
  avatar?: string;
  invitedAt?: Date;
}

// Role options
const ROLE_OPTIONS = [
  "Office Admin",
  "Accountant",
  "Treasurer",
  "Usher",
  "Developer",
  "Designer",
  "Manager",
  "Member",
];

// Mock data - in a real app, this would come from an API
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    status: "active",
    role: "Office Admin",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    status: "active",
    role: "Accountant",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    status: "active",
    role: "Treasurer",
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    status: "invited",
    role: "Usher",
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.brown@example.com",
    status: "pending",
  },
];

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getStatusConfig = (status: MemberStatus) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        icon: CheckCircle,
        badgeColor: "bg-green-500",
        textColor: "text-green-600 dark:text-green-400",
      };
    case "invited":
      return {
        label: "Invited",
        icon: Mail,
        badgeColor: "bg-blue-500",
        textColor: "text-blue-600 dark:text-blue-400",
      };
    case "pending":
      return {
        label: "Pending",
        icon: Clock,
        badgeColor: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        label: status,
        icon: User,
        badgeColor: "bg-gray-500",
        textColor: "text-gray-600 dark:text-gray-400",
      };
  }
};

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Delete Team Member
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete <strong>{memberName}</strong>{" "}
                from your team?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    memberId: string | null;
    memberName: string;
  }>({ isOpen: false, memberId: null, memberName: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Filter members based on search query and status
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group members by status for stats
  const stats = {
    all: members.length,
    active: members.filter((m) => m.status === "active").length,
    invited: members.filter((m) => m.status === "invited").length,
    pending: members.filter((m) => m.status === "pending").length,
  };

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in name and email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role || undefined,
      status: "invited",
      invitedAt: new Date(),
    };

    setMembers([...members, newMember]);
    setFormData({ name: "", email: "", role: "" });
    setShowAddForm(false);
    toast.success("Team member added successfully!");

    // Simulate status progression
    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === newMember.id ? { ...m, status: "pending" } : m
        )
      );
    }, 3000);

    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === newMember.id ? { ...m, status: "active" } : m
        )
      );
    }, 6000);
  };

  // Handle Edit Member
  const handleStartEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role || "",
    });
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in name and email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id === editingId
          ? {
              ...m,
              name: formData.name.trim(),
              email: formData.email.trim(),
              role: formData.role || undefined,
            }
          : m
      )
    );

    setEditingId(null);
    setFormData({ name: "", email: "", role: "" });
    toast.success("Team member updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", role: "" });
  };

  const handleCancelAdd = () => {
    setFormData({ name: "", email: "", role: "" });
    setShowAddForm(false);
  };

  // Handle Delete Member
  const handleDeleteClick = (member: TeamMember) => {
    setDeleteConfirm({
      isOpen: true,
      memberId: member.id,
      memberName: member.name,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.memberId) {
      setMembers((prev) => prev.filter((m) => m.id !== deleteConfirm.memberId));
      toast.success("Team member deleted successfully!");
    }
    setDeleteConfirm({ isOpen: false, memberId: null, memberName: "" });
  };

  return (
    <div className="w-full space-y-6 mobile:space-y-4">
      {/* Header Section */}
      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Team Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team and collaborate effectively
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "All Members",
              count: stats.all,
              icon: Users,
              color: "bg-gradient-to-br from-blue-500 to-indigo-600",
            },
            {
              label: "Active",
              count: stats.active,
              icon: CheckCircle,
              color: "bg-gradient-to-br from-green-500 to-emerald-600",
            },
            {
              label: "Invited",
              count: stats.invited,
              icon: Mail,
              color: "bg-gradient-to-br from-blue-500 to-cyan-600",
            },
            {
              label: "Pending",
              count: stats.pending,
              icon: Clock,
              color: "bg-gradient-to-br from-amber-500 to-yellow-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(["all", "active", "invited", "pending"] as const).map((status) => {
            const config = status === "all" ? null : getStatusConfig(status);
            const isActive = statusFilter === status;
            const StatusIcon = config?.icon;

            return (
              <motion.button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? status === "all"
                      ? "bg-blue-600 text-white shadow-lg"
                      : `text-white ${config?.badgeColor} shadow-lg`
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                {status === "all" ? (
                  <>
                    <Filter className="w-4 h-4 inline mr-2" />
                    All
                  </>
                ) : (
                  StatusIcon && (
                    <>
                      <StatusIcon className="w-4 h-4 inline mr-2" />
                      {config.label}
                    </>
                  )
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Team Members Table */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}>
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-4 py-3 hidden md:grid md:grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          <div className="col-span-2">Member</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                No team members found
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Start building your team by adding your first member"}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((member, index) => {
                const statusConfig = getStatusConfig(member.status);
                const StatusIcon = statusConfig.icon;
                const isEditing = editingId === member.id;

                return (
                  <div key={member.id}>
                    {/* Edit Form Row */}
                    {isEditing ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500">
                        <form
                          onSubmit={handleSaveEdit}
                          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Name"
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Email"
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <select
                              value={formData.role}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  role: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500">
                              <option value="">Select Role</option>
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.badgeColor} text-white`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="md:col-span-3 flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    ) : (
                      /* Regular Row */
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Member (Avatar + Name) */}
                          <div className="md:col-span-2 flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                                  {getInitials(member.name)}
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {member.name}
                            </span>
                          </div>

                          {/* Email */}
                          <div className="md:col-span-3 text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </div>

                          {/* Role */}
                          <div className="md:col-span-2 text-sm text-gray-700 dark:text-gray-300">
                            {member.role || (
                              <span className="text-gray-400 italic">
                                No role
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="md:col-span-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.badgeColor} text-white`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="md:col-span-3 flex gap-2 justify-end">
                            <motion.button
                              onClick={() => handleStartEdit(member)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteClick(member)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Add Button & Form */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          {!showAddForm && !editingId && (
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-4 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}>
              <UserPlus className="w-5 h-5" />
              Add Member
            </motion.button>
          )}

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && !editingId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500">
                <form
                  onSubmit={handleAddMember}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Name *"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Email *"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Role</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Status: Invited
                    </span>
                  </div>
                  <div className="md:col-span-3 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelAdd}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, memberId: null, memberName: "" })
        }
        onConfirm={handleDeleteConfirm}
        memberName={deleteConfirm.memberName}
      />
    </div>
  );
}
