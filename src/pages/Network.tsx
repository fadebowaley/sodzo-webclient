import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { RefreshCw, AlertCircle, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useDeviceDetection } from "../hooks/useDeviceDetection";

// Utilities and Components
import {
  Node,
  extractNodesFromResponse,
  validateNodes,
  deduplicateNodes,
  sortNodesHierarchically,
} from "../utils/networkHelpers";
import { useNodeOperations } from "../hooks/useNodeOperations";
import { useUserOperations } from "../hooks/useUserOperations";
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "../components/Network/Tabs";
import { NodeTable } from "../components/Network/NodeTable";
import { UserTable, User } from "../components/Network/UserTable";
import TurboTab from "../components/Network/TurboTab";

// Modals
import CreateNodeModal from "../components/Modals/Network/CreateNodeModal";
import EditNodeModal from "../components/Modals/Network/EditNodeModal";
import ViewNodeModal from "../components/Modals/Network/ViewNodeModal";
import AssignUsersToNodeModal from "../components/Modals/Network/AssignUsersToNodeModal";
import RestoreNodeModal from "../components/Modals/Network/RestoreNodeModal";
import CreateUserModal from "../components/Modals/Network/CreateUserModal";
import EditUserModal from "../components/Modals/Network/EditUserModal";
import AssignNodeToUserModal from "../components/Modals/Network/AssignNodeToUserModal";
import ManageUserRolesModal from "../components/Modals/Network/ManageUserRolesModal";

export default function Network() {
  const { api, logout, user } = useAuth();
  const { isMobile } = useDeviceDetection();
  const [activeTab, setActiveTab] = useState<
    "network" | "turbo" | "users" | "archived"
  >("network");

  // Modal states
  const [createNodeModalOpen, setCreateNodeModalOpen] = useState(false);
  const [editNodeModalOpen, setEditNodeModalOpen] = useState(false);
  const [viewNodeModalOpen, setViewNodeModalOpen] = useState(false);
  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState(false);
  const [restoreNodeModalOpen, setRestoreNodeModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [assignNodeModalOpen, setAssignNodeModalOpen] = useState(false);
  const [manageRolesModalOpen, setManageRolesModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);

  const nodeOps = useNodeOperations();
  const userOps = useUserOperations();

  // Get user ID from AuthContext
  const userId = user?.id || (user as any)?._id;

  // Fetch nodes using React Query
  const {
    data: nodes = [],
    isLoading: loading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["nodes", "branch", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error(
          "User ID is required. Please ensure you are logged in."
        );
      }

      // Fetch user's root nodes
      let res;
      try {
        res = await api.get(`/users/${userId}/nodes`);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          throw new Error(
            "You don't have permission to view nodes. Please contact your administrator."
          );
        }
        throw error;
      }

      // Extract user nodes from response
      const userNodes = extractNodesFromResponse(res.data);

      if (!userNodes || userNodes.length === 0) {
        return [];
      }

      // Fetch branch for each root node
      const branchResponses = await Promise.all(
        userNodes.map(async (node: any) => {
          try {
            const nodeRes = await api.get(`/node/${node.id}/branch`);

            // Extract nodes from branch response
            const branchNodes = extractNodesFromResponse(nodeRes.data);

            // Validate nodes (remove wrappers, ensure IDs)
            return validateNodes(branchNodes);
          } catch (err: any) {
            console.error(`Failed to fetch branch for node ${node.id}:`, err);
            return [];
          }
        })
      );

      // Flatten all branch responses
      const allBranchNodes = branchResponses.flat();

      // Validate and deduplicate
      const validNodes = validateNodes(allBranchNodes);
      const uniqueNodes = deduplicateNodes(validNodes);

      // Sort by path to maintain hierarchy order
      uniqueNodes.sort((a, b) => {
        const pathA = a.path || "";
        const pathB = b.path || "";
        return pathA.localeCompare(pathB);
      });

      return uniqueNodes;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
        return false;
      }
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch all nodes for table view
  const {
    data: allNodesData,
    isLoading: loadingAllNodes,
    refetch: refetchAllNodes,
    error: allNodesError,
  } = useQuery({
    queryKey: ["nodes", "all"],
    queryFn: async () => {
      const result = await nodeOps.getNodes({ limit: 1000, status: "active" });

      if (result.success && result.data) {
        // Extract nodes from response - handle multiple formats
        let nodesArray: Node[] = [];

        if (Array.isArray(result.data)) {
          nodesArray = result.data;
        } else if (result.data.results && Array.isArray(result.data.results)) {
          nodesArray = result.data.results;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          nodesArray = result.data.data;
        } else if (
          result.data.data?.results &&
          Array.isArray(result.data.data.results)
        ) {
          nodesArray = result.data.data.results;
        }

        // Validate and process nodes
        const validNodes = validateNodes(nodesArray);
        const uniqueNodes = deduplicateNodes(validNodes);
        const sortedNodes = sortNodesHierarchically(uniqueNodes);

        return sortedNodes;
      }

      return [];
    },
    enabled: activeTab === "network" || activeTab === "archived",
    retry: 2,
  });

  // Fetch archived nodes
  const {
    data: archivedNodes = [],
    isLoading: loadingArchived,
    refetch: refetchArchived,
  } = useQuery({
    queryKey: ["nodes", "archived"],
    queryFn: async () => {
      const result = await nodeOps.getNodes({
        limit: 1000,
        status: "archived",
      });
      if (result.success && result.data?.results) {
        return sortNodesHierarchically(result.data.results);
      }
      return [];
    },
    enabled: activeTab === "archived",
  });

  // Fetch users for users tab
  const {
    data: usersData,
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const result = await userOps.getUsers({ limit: 1000 });
      if (result.success && result.data?.results) {
        return result.data.results;
      }
      return [];
    },
    enabled: activeTab === "users",
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      const axiosError = error as any;
      if (
        axiosError.response?.status !== 401 &&
        axiosError.response?.status !== 403
      ) {
        toast.error("Failed to load network. Please try again.", {
          id: "network-fetch-error",
        });
      }
    }
  }, [error]);

  // Refetch data when tab changes
  useEffect(() => {
    if (activeTab === "network" || activeTab === "archived") {
      refetchAllNodes();
    }
    if (activeTab === "archived") {
      refetchArchived();
    }
    if (activeTab === "users") {
      refetchUsers();
    }
  }, [activeTab]);
  // Node action handlers
  const handleViewNode = (node: Node) => {
    setSelectedNode(node);
    setViewNodeModalOpen(true);
  };

  const handleEditNode = (node: Node) => {
    setSelectedNode(node);
    setEditNodeModalOpen(true);
  };

  const handleAddChildNode = (node: Node) => {
    setParentNodeId(node.id);
    setCreateNodeModalOpen(true);
  };

  const handleDeleteNode = async (node: Node) => {
    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) {
      return;
    }
    const result = await nodeOps.deleteNode(node.id);
    if (result.success) {
      refetch();
      if (activeTab === "network") refetchAllNodes();
      if (activeTab === "archived") refetchArchived();
    }
  };

  const handleAssignUsers = (node: Node) => {
    setSelectedNode(node);
    setAssignUsersModalOpen(true);
  };

  const handleRestoreNode = (node: Node) => {
    setSelectedNode(node);
    setRestoreNodeModalOpen(true);
  };

  const handleHardDeleteNode = async (node: Node) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete "${node.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    const result = await nodeOps.deleteNodeHard(node.id);
    if (result.success) {
      refetchArchived();
    }
  };

  // User action handlers
  const handleAssignNode = (user: User) => {
    setSelectedUser(user);
    setAssignNodeModalOpen(true);
  };

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setManageRolesModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${user.firstname} ${user.lastname}"?`
      )
    ) {
      return;
    }
    const result = await userOps.deleteUser(user.id);
    if (result.success) {
      refetchUsers();
    }
  };

  // Modal success handlers
  const handleNodeModalSuccess = () => {
    refetch();
    if (activeTab === "table") refetchAllNodes();
    if (activeTab === "archived") refetchArchived();
  };

  const handleUserModalSuccess = () => {
    refetchUsers();
  };

  // Loading state
  if (loading && nodes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400 mt-4">
          Loading network...
        </span>
      </div>
    );
  }

  // Error state
  if (error && nodes.length === 0) {
    const axiosError = error as any;
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-900 dark:text-white font-medium mb-2">
          Failed to load network
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {axiosError.response?.status === 403
            ? "You don't have permission to view the network"
            : "Please try again or contact support if the problem persists"}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-4 md:space-y-6">
      {/* Header */}
      {!isMobile && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Network
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your organization's hierarchical network structure
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "network" && (
              <button
                onClick={() => {
                  setParentNodeId(null);
                  setCreateNodeModalOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create Node
              </button>
            )}
            {activeTab === "users" && (
              <button
                onClick={() => setCreateUserModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === "network") refetchAllNodes();
                if (activeTab === "archived") refetchArchived();
                if (activeTab === "users") refetchUsers();
              }}
              disabled={isFetching}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}>
        <TabList>
          <Tab
            value="network"
            active={activeTab === "network"}
            onClick={() => setActiveTab("network")}>
            Network
          </Tab>
          <Tab
            value="turbo"
            active={activeTab === "turbo"}
            onClick={() => setActiveTab("turbo")}>
            Turbo
          </Tab>
          <Tab
            value="users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}>
            Users
          </Tab>
          <Tab
            value="archived"
            active={activeTab === "archived"}
            onClick={() => setActiveTab("archived")}>
            Archived
          </Tab>
        </TabList>

        <TabPanels>
          {/* Network Tab */}
          <TabPanel value="network" active={activeTab === "network"}>
            <div className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 p-4 md:p-6">
              {loadingAllNodes ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : allNodesError ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Failed to load nodes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {(allNodesError as any)?.message ||
                      "Unknown error occurred"}
                  </p>
                  <button
                    onClick={() => refetchAllNodes()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                  </button>
                </div>
              ) : !allNodesData || allNodesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    No nodes found
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {allNodesData === undefined
                      ? "Data is still loading..."
                      : "There are no active nodes in the system."}
                  </p>
                  <button
                    onClick={() => refetchAllNodes()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Refresh
                  </button>
                </div>
              ) : (
                <NodeTable
                  nodes={allNodesData || []}
                  onView={handleViewNode}
                  onEdit={handleEditNode}
                  onAddChild={handleAddChildNode}
                  onDelete={handleDeleteNode}
                  onAssignUsers={handleAssignUsers}
                />
              )}
            </div>
          </TabPanel>

          {/* Turbo Tab */}
          <TabPanel value="turbo" active={activeTab === "turbo"}>
            <div className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 h-[calc(100vh-300px)] min-h-[600px]">
              <TurboTab />
            </div>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel value="users" active={activeTab === "users"}>
            <div className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 p-4 md:p-6">
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <UserTable
                  users={usersData || []}
                  onAssignNode={handleAssignNode}
                  onManageRoles={handleManageRoles}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                />
              )}
            </div>
          </TabPanel>

          {/* Archived Tab */}
          <TabPanel value="archived" active={activeTab === "archived"}>
            <div className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 p-4 md:p-6">
              {loadingArchived ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <NodeTable
                  nodes={archivedNodes}
                  onView={handleViewNode}
                  onEdit={(node) => {
                    // In archived tab, Edit button should restore
                    handleRestoreNode(node);
                  }}
                  onDelete={handleHardDeleteNode}
                  showArchived={true}
                />
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modals */}
      <CreateNodeModal
        isOpen={createNodeModalOpen}
        onClose={() => {
          setCreateNodeModalOpen(false);
          setParentNodeId(null);
        }}
        onSuccess={handleNodeModalSuccess}
        parentNodeId={parentNodeId}
      />

      <EditNodeModal
        isOpen={editNodeModalOpen}
        onClose={() => {
          setEditNodeModalOpen(false);
          setSelectedNode(null);
        }}
        onSuccess={handleNodeModalSuccess}
        node={selectedNode}
      />

      <ViewNodeModal
        isOpen={viewNodeModalOpen}
        onClose={() => {
          setViewNodeModalOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode}
      />

      <AssignUsersToNodeModal
        isOpen={assignUsersModalOpen}
        onClose={() => {
          setAssignUsersModalOpen(false);
          setSelectedNode(null);
        }}
        onSuccess={handleNodeModalSuccess}
        node={selectedNode}
      />

      <RestoreNodeModal
        isOpen={restoreNodeModalOpen}
        onClose={() => {
          setRestoreNodeModalOpen(false);
          setSelectedNode(null);
        }}
        onSuccess={handleNodeModalSuccess}
        node={selectedNode}
      />

      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSuccess={handleUserModalSuccess}
      />

      <EditUserModal
        isOpen={editUserModalOpen}
        onClose={() => {
          setEditUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserModalSuccess}
        user={selectedUser}
      />

      <AssignNodeToUserModal
        isOpen={assignNodeModalOpen}
        onClose={() => {
          setAssignNodeModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserModalSuccess}
        user={selectedUser}
      />

      <ManageUserRolesModal
        isOpen={manageRolesModalOpen}
        onClose={() => {
          setManageRolesModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserModalSuccess}
        user={selectedUser}
      />
    </div>
  );
}
