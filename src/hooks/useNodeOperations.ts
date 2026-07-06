import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { Node } from "../utils/networkHelpers";

export function useNodeOperations() {
  const { api } = useAuth();

  const createNode = useCallback(
    async (data: Partial<Node>) => {
      try {
        const response = await api.post("/node", data);
        toast.success("Node created successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to create node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const updateNode = useCallback(
    async (nodeId: string, data: Partial<Node>) => {
      try {
        const response = await api.patch(`/node/${nodeId}`, data);
        toast.success("Node updated successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to update node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      try {
        await api.delete(`/node/${nodeId}`);
        toast.success("Node deleted successfully");
        return { success: true };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to delete node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const deleteNodeHard = useCallback(
    async (nodeId: string) => {
      try {
        await api.delete(`/node/${nodeId}/hard`);
        toast.success("Node permanently deleted");
        return { success: true };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to delete node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const restoreNode = useCallback(
    async (
      nodeId: string,
      payload: { parent?: string | null; level?: string }
    ) => {
      try {
        const response = await api.patch(`/node/${nodeId}/restore`, payload);
        toast.success("Node restored successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to restore node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const assignUsersToNode = useCallback(
    async (nodeId: string, userIds: string[]) => {
      try {
        const response = await api.patch(`/node/${nodeId}/assign-users`, {
          userIds,
        });
        toast.success("Users assigned successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to assign users";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const moveNode = useCallback(
    async (nodeId: string, parentId: string | null) => {
      try {
        const response = await api.patch(`/node/${nodeId}/move`, {
          parent: parentId,
        });
        toast.success("Node moved successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message = error?.response?.data?.message || "Failed to move node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const activateNode = useCallback(
    async (nodeId: string) => {
      try {
        const response = await api.patch(`/node/${nodeId}/activate`, {});
        toast.success("Node activated successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to activate node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const deactivateNode = useCallback(
    async (nodeId: string) => {
      try {
        const response = await api.patch(`/node/${nodeId}/deactivate`, {});
        toast.success("Node deactivated successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to deactivate node";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const getNodeById = useCallback(
    async (nodeId: string) => {
      try {
        const response = await api.get(`/node/${nodeId}`);
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to fetch node";
        return { success: false, error: message };
      }
    },
    [api]
  );

  const getNodes = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: "active" | "archived" | "all";
    }) => {
      try {
        const response = await api.get("/node", { params });
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to fetch nodes";
        return { success: false, error: message };
      }
    },
    [api]
  );

  return {
    createNode,
    updateNode,
    deleteNode,
    deleteNodeHard,
    restoreNode,
    assignUsersToNode,
    moveNode,
    activateNode,
    deactivateNode,
    getNodeById,
    getNodes,
  };
}
