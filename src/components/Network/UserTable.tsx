import { useState } from "react";
import { UserPlus, Shield, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/networkHelpers";

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber?: string;
  roles?: { id: string; name: string }[];
  isActive?: boolean;
  isOwner?: boolean;
  isSuper?: boolean;
  isSaby?: boolean;
  createdAt?: string;
  avatar?: string;
}

interface UserTableProps {
  users: User[];
  onAssignNode?: (user: User) => void;
  onManageRoles?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UserTable({
  users,
  onAssignNode,
  onManageRoles,
  onEdit,
  onDelete,
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.firstname?.toLowerCase().includes(search) ||
      user.lastname?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phoneNumber?.toLowerCase().includes(search)
    );
  });

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Phone
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Roles
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Created
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstname} ${user.lastname}`}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.firstname?.[0]?.toUpperCase()}
                        {user.lastname?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.firstname} {user.lastname}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {user.phoneNumber || "—"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No roles</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      user.isActive !== false
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                    {user.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {onAssignNode && (
                      <button
                        onClick={() => onAssignNode(user)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Assign Node">
                        <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    {onManageRoles && (
                      <button
                        onClick={() => onManageRoles(user)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Manage Roles">
                        <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(user)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit">
                        <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(user)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No users match your search
        </div>
      )}
    </div>
  );
}
