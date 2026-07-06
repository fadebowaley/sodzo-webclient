import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  Check,
  Users as UsersIcon,
  Building,
  Plus,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNodeOperations } from "../../hooks/useNodeOperations";
import { useUserOperations } from "../../hooks/useUserOperations";
import { Node } from "../../utils/networkHelpers";
import toast from "react-hot-toast";

interface TurboTabProps {}

interface DraftPairing {
  userId: string;
  userName: string;
  userEmail: string;
  nodeId: string | null; // null means not yet assigned
  nodeName: string | null;
}

interface QueuedAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  nodeId: string;
  nodeName: string;
  nodeLocation?: string;
}

export default function TurboTab({}: TurboTabProps) {
  const { api } = useAuth();
  const { getNodes } = useNodeOperations();
  const { getUsers } = useUserOperations();

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [nodeSearchTerm, setNodeSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [draftPairings, setDraftPairings] = useState<DraftPairing[]>([]);

  // Custom setter for draftPairings that enforces uniqueness by userId
  // This is the SINGLE SOURCE OF TRUTH for updating draftPairings
  const setDraftPairingsUnique = useCallback(
    (updater: (prev: DraftPairing[]) => DraftPairing[]) => {
      setDraftPairings((prev) => {
        const updated = updater(prev);
        // Enforce uniqueness: keep only first occurrence of each userId
        const uniqueMap = new Map<string, DraftPairing>();
        updated.forEach((draft) => {
          if (!uniqueMap.has(draft.userId)) {
            uniqueMap.set(draft.userId, draft);
          } else {
            // If duplicate found, prefer the one with a node assigned
            const existing = uniqueMap.get(draft.userId)!;
            if (draft.nodeId && !existing.nodeId) {
              uniqueMap.set(draft.userId, draft);
            }
          }
        });
        const unique = Array.from(uniqueMap.values());

        // Log warning if duplicates were removed
        if (unique.length !== updated.length) {
          console.warn(
            `[Turbo] State update: Removed ${
              updated.length - unique.length
            } duplicate(s) from draftPairings`
          );
        }

        return unique;
      });
    },
    []
  );
  const [queuedAssignments, setQueuedAssignments] = useState<
    QueuedAssignment[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Fetch users
  const { data: usersData = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["turbo", "users"],
    queryFn: async () => {
      const result = await getUsers({ limit: 1000 });
      return result.success && result.data?.results ? result.data.results : [];
    },
  });

  // Fetch nodes
  const { data: nodesData = [], isLoading: loadingNodes } = useQuery({
    queryKey: ["turbo", "nodes"],
    queryFn: async () => {
      const result = await getNodes({ limit: 1000, status: "active" });
      return result.success && result.data?.results ? result.data.results : [];
    },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return usersData;
    const search = userSearchTerm.toLowerCase();
    return usersData.filter(
      (user: any) =>
        user.firstname?.toLowerCase().includes(search) ||
        user.lastname?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
    );
  }, [usersData, userSearchTerm]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    if (!nodeSearchTerm) return nodesData;
    const search = nodeSearchTerm.toLowerCase();
    return nodesData.filter(
      (node: Node) =>
        node.name?.toLowerCase().includes(search) ||
        node.city?.toLowerCase().includes(search) ||
        node.level?.name?.toLowerCase().includes(search)
    );
  }, [nodesData, nodeSearchTerm]);

  // Toggle user selection
  const toggleUser = useCallback(
    (userId: string) => {
      setSelectedUserIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          // Remove user
          newSet.delete(userId);
          // Remove from draft pairings (filter ALL instances to be safe)
          setDraftPairingsUnique((drafts) =>
            drafts.filter((d) => d.userId !== userId)
          );
        } else {
          // Add user
          newSet.add(userId);
          // Add to draft pairings ONLY if not already present
          const user = usersData.find((u: any) => (u.id || u._id) === userId);
          if (user) {
            setDraftPairingsUnique((drafts) => {
              // CRITICAL: Check if this user already exists in drafts
              const existingIndex = drafts.findIndex(
                (d) => d.userId === userId
              );
              if (existingIndex !== -1) {
                // Already exists - return drafts unchanged (no duplicate)
                console.warn(
                  `[Turbo] User ${userId} already in draftPairings, not adding duplicate`
                );
                return drafts;
              }
              // Add new draft pairing
              return [
                ...drafts,
                {
                  userId,
                  userName: `${user.firstname} ${user.lastname}`,
                  userEmail: user.email,
                  nodeId: null,
                  nodeName: null,
                },
              ];
            });
          }
        }
        return newSet;
      });
    },
    [usersData, setDraftPairingsUnique]
  );

  // Assign node to a specific user in draft pairings
  const assignNodeToUser = useCallback(
    (userId: string, nodeId: string) => {
      const node = nodesData.find((n: any) => (n.id || n._id) === nodeId);
      if (!node) return;

      setDraftPairingsUnique((drafts) =>
        drafts.map((draft) =>
          draft.userId === userId
            ? {
                ...draft,
                nodeId,
                nodeName: node.name,
              }
            : draft
        )
      );
    },
    [nodesData, setDraftPairingsUnique]
  );

  // Remove node assignment from a user
  const removeNodeFromUser = useCallback(
    (userId: string) => {
      setDraftPairingsUnique((drafts) =>
        drafts.map((draft) =>
          draft.userId === userId
            ? { ...draft, nodeId: null, nodeName: null }
            : draft
        )
      );
    },
    [setDraftPairingsUnique]
  );

  // Remove user from draft pairings
  const removeUserFromDrafts = useCallback(
    (userId: string) => {
      // Remove from selected users
      setSelectedUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      // Remove from draft pairings (setDraftPairingsUnique ensures uniqueness)
      setDraftPairingsUnique((drafts) =>
        drafts.filter((d) => d.userId !== userId)
      );
    },
    [setDraftPairingsUnique]
  );

  // Add all complete pairings to queue
  const addPairingsToQueue = useCallback(() => {
    // draftPairings should already be unique (enforced by setDraftPairingsUnique)
    // But we'll do a defensive check just in case
    const uniqueDraftPairings = Array.from(
      new Map(draftPairings.map((d) => [d.userId, d])).values()
    );

    // Log warning if duplicates were found (shouldn't happen with unique setter)
    if (uniqueDraftPairings.length !== draftPairings.length) {
      console.warn(
        `[Turbo] Found ${
          draftPairings.length - uniqueDraftPairings.length
        } duplicate(s) in draftPairings (should not happen)`
      );
    }

    const completePairings = uniqueDraftPairings.filter(
      (draft) => draft.nodeId !== null
    );

    if (completePairings.length === 0) {
      toast.error("No complete pairings to add. Please assign nodes to users.");
      return;
    }

    const incompleteCount =
      uniqueDraftPairings.length - completePairings.length;
    if (incompleteCount > 0) {
      toast.error(
        `${incompleteCount} user(s) do not have assigned nodes. Please complete all pairings.`
      );
      return;
    }

    const newAssignments: QueuedAssignment[] = completePairings.map(
      (pairing) => {
        const node = nodesData.find(
          (n: any) => (n.id || n._id) === pairing.nodeId
        );
        return {
          id: `${pairing.userId}-${pairing.nodeId}-${Date.now()}`,
          userId: pairing.userId,
          userName: pairing.userName,
          userEmail: pairing.userEmail,
          nodeId: pairing.nodeId!,
          nodeName: pairing.nodeName!,
          nodeLocation: node?.city,
        };
      }
    );

    // Check for duplicates in queue
    const duplicates = newAssignments.filter((newAssign) =>
      queuedAssignments.some(
        (existing) =>
          existing.userId === newAssign.userId &&
          existing.nodeId === newAssign.nodeId
      )
    );

    if (duplicates.length > 0) {
      toast.error(
        `${duplicates.length} assignment(s) are already in the queue`
      );
      return;
    }

    setQueuedAssignments((prev) => [...prev, ...newAssignments]);
    toast.success(`${newAssignments.length} assignment(s) added to queue`);

    // Clear draft pairings and selections
    setDraftPairingsUnique(() => []);
    setSelectedUserIds(new Set());
  }, [draftPairings, nodesData, queuedAssignments, setDraftPairingsUnique]);

  // Remove assignment from queue
  const removeFromQueue = useCallback((assignmentId: string) => {
    setQueuedAssignments((prev) => prev.filter((qa) => qa.id !== assignmentId));
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueuedAssignments([]);
    toast.success("Queue cleared");
  }, []);

  // Clear all drafts
  const clearDrafts = useCallback(() => {
    // Defensive: Ensure clean state
    setDraftPairingsUnique(() => []);
    setSelectedUserIds(new Set());
    toast.success("Draft pairings cleared");
  }, [setDraftPairingsUnique]);

  // Apply all queued assignments
  const applyAssignments = useCallback(async () => {
    if (queuedAssignments.length === 0) {
      toast.error("No assignments to apply");
      return;
    }

    setLoading(true);
    try {
      // Group assignments by node for efficient API calls
      const assignmentsByNode = new Map<string, string[]>();
      queuedAssignments.forEach((assignment) => {
        if (!assignmentsByNode.has(assignment.nodeId)) {
          assignmentsByNode.set(assignment.nodeId, []);
        }
        assignmentsByNode.get(assignment.nodeId)!.push(assignment.userId);
      });

      // Apply assignments node by node
      const promises = Array.from(assignmentsByNode.entries()).map(
        async ([nodeId, userIds]) => {
          try {
            await api.patch(`/node/${nodeId}/assign-users`, { userIds });
          } catch (error) {
            console.error(`Failed to assign users to node ${nodeId}:`, error);
            throw error;
          }
        }
      );

      await Promise.all(promises);

      toast.success(
        `Successfully assigned ${queuedAssignments.length} user(s) to node(s)`
      );
      clearQueue();
    } catch (error: any) {
      console.error("Error applying assignments:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to apply assignments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [queuedAssignments, api, clearQueue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+Enter or Ctrl+Enter to apply queue
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (queuedAssignments.length > 0) {
          e.preventDefault();
          applyAssignments();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyAssignments, queuedAssignments.length]);

  // Note: We don't need selectedUsers - pairing panel renders from draftPairings only

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Fixed Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Turbo: Bulk Assignment
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select multiple users, assign nodes to each, then add all to queue
          </p>
        </div>
        {draftPairings.length > 0 && (
          <button
            onClick={clearDrafts}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Clear Drafts
          </button>
        )}
      </div>

      {/* Main Content: Three Panels */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
        {/* Fixed Left Panel: Users (Multi-Select) */}
        <div className="w-[280px] flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                SELECT USERS
                {selectedUserIds.size > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    {selectedUserIds.size}
                  </span>
                )}
              </h3>
              {selectedUserIds.size > 0 && (
                <button
                  onClick={() => {
                    setSelectedUserIds(new Set());
                    setDraftPairingsUnique(() => []);
                  }}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingUsers ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                {userSearchTerm ? "No users found" : "No users available"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user: any) => {
                  const userId = user.id || user._id;
                  const isSelected = selectedUserIds.has(userId);
                  return (
                    <div
                      key={userId}
                      onClick={() => toggleUser(userId)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                            : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}>
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }
                        `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.firstname} ${user.lastname}`}
                          className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {user.firstname?.[0]?.toUpperCase()}
                          {user.lastname?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {user.firstname} {user.lastname}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel: Pairing Interface */}
        <div className="w-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                ASSIGN NODES
                {draftPairings.filter((d) => d.nodeId !== null).length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                    {draftPairings.filter((d) => d.nodeId !== null).length}{" "}
                    assigned
                  </span>
                )}
              </h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes to assign..."
                value={nodeSearchTerm}
                onChange={(e) => setNodeSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {draftPairings.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                Select users from the left panel to start pairing
              </div>
            ) : (
              <div className="space-y-3">
                {/* Render from draftPairings - uniqueness enforced at state level */}
                {draftPairings.map((pairing) => {
                  const user = usersData.find(
                    (u: any) => (u.id || u._id) === pairing.userId
                  );
                  return (
                    <div
                      key={pairing.userId}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                      {/* User Info */}
                      <div className="flex items-center gap-2 mb-3">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={pairing.userName}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {pairing.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {pairing.userName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {pairing.userEmail}
                          </div>
                        </div>
                        <button
                          onClick={() => removeUserFromDrafts(pairing.userId)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Node Assignment */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                          Assign to Node:
                        </label>
                        {pairing.nodeId ? (
                          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Building className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {pairing.nodeName}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeNodeFromUser(pairing.userId)}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors">
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {filteredNodes.map((node: Node) => {
                              const nodeId = node.id;
                              return (
                                <button
                                  key={nodeId}
                                  onClick={() =>
                                    assignNodeToUser(pairing.userId, nodeId)
                                  }
                                  className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600">
                                  <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-900 dark:text-white truncate">
                                      {node.name}
                                    </div>
                                    {node.city && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        📍 {node.city}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {draftPairings.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={addPairingsToQueue}
                disabled={
                  draftPairings.some((d) => d.nodeId === null) ||
                  draftPairings.length === 0
                }
                className={`
                  w-full px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2
                  ${
                    draftPairings.some((d) => d.nodeId === null) ||
                    draftPairings.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}>
                <Plus className="w-4 h-4" />
                Add All to Queue (
                {draftPairings.filter((d) => d.nodeId !== null).length} of{" "}
                {draftPairings.length})
              </button>
              {draftPairings.some((d) => d.nodeId === null) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                  Complete all node assignments before adding to queue
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Queue Preview */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-w-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4" />
                QUEUE PREVIEW
                {queuedAssignments.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    {queuedAssignments.length}
                  </span>
                )}
              </h3>
              {queuedAssignments.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Clear Queue
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {queuedAssignments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                Queue is empty. Complete pairings and add to queue.
              </div>
            ) : (
              <div className="space-y-2">
                {queuedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {assignment.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {assignment.userName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <ArrowRight className="w-3 h-3" />
                          <span className="truncate">
                            {assignment.nodeName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(assignment.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {queuedAssignments.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={applyAssignments}
                disabled={loading}
                className={`
                  w-full px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }
                `}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply All Assignments ({queuedAssignments.length})
                  </>
                )}
              </button>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                  ⌘+Enter
                </kbd>{" "}
                or{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                  Ctrl+Enter
                </kbd>{" "}
                to apply
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
