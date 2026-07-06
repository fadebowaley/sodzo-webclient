import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

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

export function useUserOperations() {
  const { api } = useAuth();

  const getUsers = useCallback(
    async (filters?: {
      page?: number;
      limit?: number;
      status?: string;
      roles?: string;
      search?: string;
    }) => {
      try {
        const response = await api.get("/users", { params: filters });
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to fetch users";
        return { success: false, error: message };
      }
    },
    [api]
  );

  const getUser = useCallback(
    async (userId: string) => {
      try {
        const response = await api.get(`/users/${userId}`);
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to fetch user";
        return { success: false, error: message };
      }
    },
    [api]
  );

  const createUser = useCallback(
    async (data: Partial<User> & { password?: string }) => {
      try {
        const response = await api.post("/users", data);
        toast.success("User created successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to create user";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const updateUser = useCallback(
    async (userId: string, data: Partial<User>) => {
      try {
        const response = await api.patch(`/users/${userId}`, data);
        toast.success("User updated successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to update user";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        await api.delete(`/users/${userId}`);
        toast.success("User deleted successfully");
        return { success: true };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to delete user";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  const assignRolesToUser = useCallback(
    async (userId: string, roleIds: string[]) => {
      try {
        const response = await api.patch(`/users/${userId}/assign-roles`, {
          roles: roleIds,
        });
        toast.success("Roles assigned successfully");
        return { success: true, data: response.data };
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to assign roles";
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [api]
  );

  return {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    assignRolesToUser,
  };
}
