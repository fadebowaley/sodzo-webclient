import { useState, useMemo, useEffect } from "react";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Node, formatDate, buildHierarchy } from "../../utils/networkHelpers";
import { LevelBadge } from "./LevelBadge";

interface NodeTableProps {
  nodes: Node[];
  onView?: (node: Node) => void;
  onEdit?: (node: Node) => void;
  onAddChild?: (node: Node) => void;
  onDelete?: (node: Node) => void;
  onAssignUsers?: (node: Node) => void;
  showArchived?: boolean;
}

// Vertical bar colors for hierarchy levels
const getHierarchyBarColor = (depth: number): string => {
  const colors = [
    "bg-purple-500", // Level 0 - purple
    "bg-blue-500", // Level 1 - blue
    "bg-red-500", // Level 2 - red
    "bg-green-500", // Level 3 - green
    "bg-yellow-500", // Level 4 - yellow
    "bg-orange-500", // Level 5 - orange
  ];
  return colors[depth % colors.length];
};

interface FlatNode extends Node {
  depth: number;
  isVisible: boolean;
  children?: FlatNode[];
}

export function NodeTable({
  nodes,
  onView,
  onEdit,
  onAddChild,
  onDelete,
  onAssignUsers,
  showArchived = false,
}: NodeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchy from flat nodes list
  const hierarchicalNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    return buildHierarchy(nodes);
  }, [nodes]);

  // Flatten hierarchy for display with visibility tracking
  const flattenWithVisibility = (
    nodeList: Node[],
    depth: number = 0,
    parentExpanded: boolean = true
  ): FlatNode[] => {
    const result: FlatNode[] = [];

    for (const node of nodeList) {
      const isExpanded = expandedNodes.has(node.id);
      const isVisible = depth === 0 || parentExpanded;
      const hasChildren = node.children && node.children.length > 0;

      if (isVisible) {
        result.push({
          ...node,
          depth,
          isVisible: true,
          children: node.children as FlatNode[] | undefined,
        });

        // Recursively add children if parent is expanded
        if (hasChildren && isExpanded) {
          result.push(
            ...flattenWithVisibility(node.children || [], depth + 1, true)
          );
        }
      }
    }

    return result;
  };

  const flatNodes = useMemo(() => {
    return flattenWithVisibility(hierarchicalNodes);
  }, [hierarchicalNodes, expandedNodes]);

  // Auto-expand root nodes on initial load
  useEffect(() => {
    if (expandedNodes.size === 0 && hierarchicalNodes.length > 0) {
      const rootIds = hierarchicalNodes.map((n) => n.id).filter(Boolean);
      if (rootIds.length > 0) {
        setExpandedNodes(new Set(rootIds));
      }
    }
  }, [hierarchicalNodes.length]); // Only run when hierarchy changes

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Filter by search term
  const filteredNodes = flatNodes.filter((node) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      node.name?.toLowerCase().includes(search) ||
      node.nodeId?.toLowerCase().includes(search) ||
      node.city?.toLowerCase().includes(search) ||
      node.level?.name?.toLowerCase().includes(search) ||
      node.users?.some((u: any) =>
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(search)
      )
    );
  });

  // Format user display with avatar, name, and email
  const formatUserDisplay = (users: any[] | undefined) => {
    if (!users || users.length === 0) return null;

    // Show first user if available
    const user = users[0];
    const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
    const email = user.email || "";

    return { fullName, email, avatar: user.avatar, user };
  };

  // Format role display
  const formatRole = (users: any[] | undefined): string => {
    if (!users || users.length === 0) return "—";
    // Try to get role from user - adjust based on your user model structure
    const user = users[0];

    // If user has a direct role string
    if (typeof user.role === "string") {
      return user.role;
    }

    // If user has roles array
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      const role = user.roles[0];
      // If role is an object with name property
      if (typeof role === "object" && role !== null) {
        return role.name || role.id || String(role);
      }
      // If role is a string
      if (typeof role === "string") {
        return role;
      }
    }

    return "—";
  };

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No {showArchived ? "archived" : ""} nodes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Node ID
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                City
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Level
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              {showArchived && (
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Deleted
                </th>
              )}
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredNodes.map((node) => {
              const hasChildren = node.children && node.children.length > 0;
              const isExpanded = expandedNodes.has(node.id);
              const indent = node.depth * 24;
              const barColor = getHierarchyBarColor(node.depth);
              const userDisplay = formatUserDisplay(node.users);

              return (
                <tr
                  key={node.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-800">
                  {/* Node ID */}
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-mono">
                    {node.nodeId || "—"}
                  </td>

                  {/* Name with hierarchy bar */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      {/* Vertical hierarchy bar */}
                      <div
                        className={`w-1 ${barColor} rounded-full flex-shrink-0`}
                        style={{ minHeight: "40px", marginLeft: `${indent}px` }}
                      />

                      {/* Expand/Collapse Icon */}
                      {hasChildren ? (
                        <button
                          onClick={() => toggleNode(node.id)}
                          className="mt-0.5 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      ) : (
                        <div className="w-5" /> // Spacer for alignment
                      )}

                      {/* Node Name and Level */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {node.name || "—"}
                        </div>
                        {node.level && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {typeof node.level === "object" &&
                            node.level !== null
                              ? node.level.name || node.level.id || "—"
                              : String(node.level)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* City */}
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {node.city || "—"}
                  </td>

                  {/* Level */}
                  <td className="py-3 px-4">
                    <LevelBadge level={node.level} />
                  </td>

                  {/* User */}
                  <td className="py-3 px-4 text-sm">
                    {userDisplay ? (
                      <div className="flex items-center gap-2">
                        {userDisplay.avatar ? (
                          <img
                            src={userDisplay.avatar}
                            alt={userDisplay.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {userDisplay.fullName?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {userDisplay.fullName}
                          </div>
                          {userDisplay.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {userDisplay.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        —
                      </span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    {formatRole(node.users) !== "—" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {formatRole(node.users)}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        —
                      </span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="whitespace-nowrap">
                      {formatDate(node.createdAt)}
                    </div>
                  </td>

                  {/* Deleted (Archived only) */}
                  {showArchived && (
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(node.deletedAt)}
                    </td>
                  )}

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {!showArchived ? (
                        <>
                          {onView && (
                            <button
                              onClick={() => onView(node)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="View">
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(node)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Edit">
                              <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          {onAddChild && (
                            <button
                              onClick={() => onAddChild(node)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Add Child">
                              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          {onAssignUsers && (
                            <button
                              onClick={() => onAssignUsers(node)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Assign Users">
                              <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(node)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(node)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Restore">
                              <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(node)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete Permanently">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredNodes.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No nodes match your search
        </div>
      )}
    </div>
  );
}
