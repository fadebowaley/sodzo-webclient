import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Building,
  MapPin,
  Users,
} from "lucide-react";
import { Node, getNodeDepth } from "../../utils/networkHelpers";

interface NodeTreeViewProps {
  nodes: Node[];
  onNodeClick?: (node: Node) => void;
}

export function NodeTreeView({ nodes, onNodeClick }: NodeTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Auto-expand root nodes on initial load
  useEffect(() => {
    if (nodes.length > 0 && expandedNodes.size === 0) {
      const rootNodeIds = nodes.map((n) => n.id).filter(Boolean);
      if (rootNodeIds.length > 0) {
        setExpandedNodes(new Set(rootNodeIds));
      }
    }
  }, [nodes.length, expandedNodes.size]);

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

  const renderNode = (node: Node, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indent = depth * 20;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg cursor-pointer
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors
            ${depth > 0 ? "ml-4" : ""}
          `}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onNodeClick?.(node);
          }}>
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <Building className="w-4 h-4 text-gray-500" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{node.name}</div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {node.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{node.city}</span>
                </div>
              )}
              {node.users && node.users.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{node.users.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No nodes found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">{nodes.map((node) => renderNode(node))}</div>
  );
}
