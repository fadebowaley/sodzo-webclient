/**
 * Network Helper Utilities
 * Consolidated helper functions for network/node operations
 */

export interface Node {
  id: string;
  nodeId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  level?: {
    id: string;
    name: string;
  };
  structure?: {
    id: string;
    name: string;
  };
  parent?: string | { id: string; name: string };
  children?: Node[];
  isMain?: boolean;
  isActive?: boolean;
  path?: string;
  users?: any[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/**
 * Extract nodes array from API response
 * Handles multiple response formats: {results: [...]}, {data: [...]}, direct array, single object
 */
export function extractNodesFromResponse(responseData: any): Node[] {
  if (!responseData) {
    return [];
  }

  // Priority 1: Check if data.results exists (most common format: {results: [...]})
  if (responseData.results && Array.isArray(responseData.results)) {
    return responseData.results;
  }

  // Priority 2: Check if data is directly an array
  if (Array.isArray(responseData)) {
    return responseData;
  }

  // Priority 3: Check if data.data exists (double-wrapped)
  if (responseData.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }

  // Priority 4: Check if it's a single node object
  if (responseData.id || responseData._id) {
    return [responseData];
  }

  // Unknown format - return empty array
  console.error("[Network] Unknown response format:", {
    data: responseData,
    keys: typeof responseData === "object" ? Object.keys(responseData) : [],
    type: typeof responseData,
  });
  return [];
}

/**
 * Validate and filter nodes - ensure all have IDs and are not wrappers
 */
export function validateNodes(nodes: any[]): Node[] {
  return nodes.filter((node: any) => {
    // Skip if node is null/undefined
    if (!node || typeof node !== "object") {
      return false;
    }

    // Skip if node has 'results' property (this is a response wrapper, not a node)
    if (node.results && Array.isArray(node.results)) {
      return false;
    }

    // Skip if node has 'data' property with array (another wrapper format)
    if (node.data && Array.isArray(node.data)) {
      return false;
    }

    // Node must have an id field
    return !!(node.id || node._id);
  });
}

/**
 * Normalize node ID - handles both id and _id fields
 */
export function normalizeNodeId(node: any): string | null {
  if (!node) return null;
  return node.id || node._id || null;
}

/**
 * Normalize parent ID - handles string, object, or null
 */
export function normalizeParentId(parent: any): string | null {
  if (!parent || parent === null) return null;
  if (typeof parent === "string") return parent;
  if (typeof parent === "object") {
    return parent.id || parent._id || null;
  }
  return String(parent);
}

/**
 * Build hierarchy from flat node list using parent relationships
 */
export function buildHierarchy(nodeList: Node[]): Node[] {
  if (!nodeList || nodeList.length === 0) {
    return [];
  }

  // CRITICAL: Check if nodeList itself contains a wrapper
  if (nodeList.length === 1 && nodeList[0] && typeof nodeList[0] === "object") {
    const firstItem = nodeList[0] as any;
    if (firstItem.results && Array.isArray(firstItem.results)) {
      console.error("[Network] nodeList contains a wrapper! Extracting:", {
        resultsCount: firstItem.results.length,
      });
      nodeList = firstItem.results as any;
    }
  }

  const nodeMap = new Map<string, Node>();
  const rootNodes: Node[] = [];

  // First pass: create map of all nodes with empty children array
  const validNodeList = validateNodes(nodeList);

  validNodeList.forEach((node) => {
    const normalizedId = normalizeNodeId(node);
    if (normalizedId) {
      nodeMap.set(normalizedId, { ...node, id: normalizedId, children: [] });
    }
  });

  // Second pass: build parent-child relationships
  validNodeList.forEach((node) => {
    const normalizedNodeId = normalizeNodeId(node);
    if (!normalizedNodeId) return;

    const nodeWithChildren = nodeMap.get(normalizedNodeId);
    if (!nodeWithChildren) return;

    const parentId = normalizeParentId(node.parent);
    let parent: Node | undefined = undefined;

    if (parentId) {
      parent = nodeMap.get(parentId);

      // Fallback lookup if parent not found by direct ID
      if (!parent) {
        for (const [id, n] of nodeMap.entries()) {
          if (String(id) === String(parentId)) {
            parent = n;
            break;
          }
        }
      }
    }

    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(nodeWithChildren);
    } else {
      rootNodes.push(nodeWithChildren);
    }
  });

  // Sort root nodes and their children by path
  const sortNodes = (nodes: Node[]): Node[] => {
    return nodes
      .sort((a, b) => {
        const pathA = a.path || "";
        const pathB = b.path || "";
        return pathA.localeCompare(pathB);
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : [],
      }));
  };

  return sortNodes(rootNodes);
}

/**
 * Deduplicate nodes by ID
 */
export function deduplicateNodes(nodes: Node[]): Node[] {
  const nodeMap = new Map<string, Node>();

  nodes.forEach((node) => {
    const nodeId = normalizeNodeId(node);
    if (!nodeId) return;

    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, {
        ...node,
        id: nodeId,
      });
    }
  });

  return Array.from(nodeMap.values());
}

/**
 * Sort nodes hierarchically (parent before children)
 */
export function sortNodesHierarchically(nodes: Node[]): Node[] {
  const nodeMap = new Map<string, Node>();
  const childrenMap = new Map<string, Node[]>();
  const rootNodes: Node[] = [];

  // First pass: build node map with all node IDs
  nodes.forEach((node) => {
    const nodeId = normalizeNodeId(node);
    if (!nodeId) return;
    nodeMap.set(nodeId, node);
  });

  // Second pass: build parent-child relationships
  // Nodes whose parents are NOT in the current batch are treated as root nodes
  // (Server sends user's assigned node and its children, but not parent hierarchy)
  nodes.forEach((node) => {
    const nodeId = normalizeNodeId(node);
    if (!nodeId) return;

    const parentId = normalizeParentId(node.parent);

    // If no parent OR parent not in current batch, treat as root node
    if (!parentId || !nodeMap.has(parentId)) {
      rootNodes.push(node);
    } else {
      // Parent exists in batch - add as child
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(node);
    }
  });

  // Recursive function to flatten tree in order
  function flattenNode(node: Node, result: Node[], depth: number = 0): void {
    result.push(node);
    const nodeId = normalizeNodeId(node);
    if (!nodeId) return;

    const children = childrenMap.get(nodeId) || [];
    children.sort((a, b) => {
      const pathA = a.path || "";
      const pathB = b.path || "";
      return pathA.localeCompare(pathB);
    });
    children.forEach((child) => flattenNode(child, result, depth + 1));
  }

  // Build the final sorted array
  const sortedNodes: Node[] = [];
  rootNodes.sort((a, b) => {
    const pathA = a.path || "";
    const pathB = b.path || "";
    return pathA.localeCompare(pathB);
  });
  rootNodes.forEach((rootNode) => flattenNode(rootNode, sortedNodes));

  return sortedNodes;
}

/**
 * Get node depth from path
 */
export function getNodeDepth(node: Node): number {
  if (!node.path) return 0;
  return node.path.split("/").length - 1;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
