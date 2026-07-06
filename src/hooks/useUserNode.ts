/**
 * useUserNode
 *
 * Fetches the current user's assigned nodes from `GET /v1/users/:userId/nodes`
 * and returns the primary one (isMain === true, or the first in the list).
 *
 * The result is cached in module-scope so repeated calls within the same
 * browser session never re-fetch.  The cache is keyed by userId so switching
 * accounts always gets fresh data.
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface UserNode {
  /** Mongoose virtualises _id as `id` in JSON responses */
  id?: string;
  _id?: string;
  nodeId?: string; // custom reference code, e.g. "HLN-000EP"
  name?: string;
  isMain?: boolean;
  isActive?: boolean;
  level?: { name?: string };
  structure?: { name?: string };
}

interface UseUserNodeResult {
  node: UserNode | null;
  nodeId: string | null; // business nodeId (e.g. HLN-000EP)
  nodeObjectId: string | null; // Mongo _id when needed for legacy flows
  nodes: UserNode[];       // full list in case the caller wants to show a picker
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Module-level cache: userId → UserNode[]
const nodeCache = new Map<string, UserNode[]>();

export function useUserNode(): UseUserNodeResult {
  const { api, user } = useAuth();
  const userId = user?.id || user?.userId || "";

  const [nodes, setNodes] = useState<UserNode[]>(() => nodeCache.get(userId) ?? []);
  const [loading, setLoading] = useState(!nodeCache.has(userId));
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchNodes = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/users/${userId}/nodes`);
      const raw = res.data;
      const list: UserNode[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.nodes)
        ? raw.nodes
        : Array.isArray(raw?.results)
        ? raw.results
        : [];
      nodeCache.set(userId, list);
      setNodes(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load user nodes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    if (nodeCache.has(userId)) {
      // Already cached — use immediately, no request needed
      setNodes(nodeCache.get(userId)!);
      setLoading(false);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNodes();
  }, [userId]);

  // Primary node: prefer isMain === true, fall back to first active, then first overall
  const primaryNode: UserNode | null =
    nodes.find((n) => n.isMain && n.isActive !== false) ??
    nodes.find((n) => n.isActive !== false) ??
    nodes[0] ??
    null;

  const resolvedNodeId = primaryNode?.nodeId ?? null;
  // Mongoose serialises ObjectId as virtual `id`; fall back to `_id` for safety
  const resolvedObjectId = primaryNode?.id ?? primaryNode?._id ?? null;

  return {
    node: primaryNode,
    nodeId: resolvedNodeId,
    nodeObjectId: resolvedObjectId,
    nodes,
    loading,
    error,
    refetch: fetchNodes,
  };
}
