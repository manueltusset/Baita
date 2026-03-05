import type { PaneNode, PaneLeaf, PaneSplit, SplitDirection } from "./types";

let paneCounter = 1;

export function generatePaneId(): string {
  return `pane-${++paneCounter}`;
}

export function countLeaves(node: PaneNode): number {
  if (node.type === "leaf") return 1;
  return countLeaves(node.children[0]) + countLeaves(node.children[1]);
}

export function findFirstLeaf(node: PaneNode): PaneLeaf {
  if (node.type === "leaf") return node;
  return findFirstLeaf(node.children[0]);
}

// Bottom-up tree traversal with immutable transform
function mapNode(node: PaneNode, fn: (n: PaneNode) => PaneNode): PaneNode {
  if (node.type === "leaf") return fn(node);
  const mapped: PaneSplit = {
    ...node,
    children: [
      mapNode(node.children[0], fn),
      mapNode(node.children[1], fn),
    ] as [PaneNode, PaneNode],
  };
  return fn(mapped);
}

// Split a leaf into a split with 2 children
export function splitNodeAt(
  root: PaneNode,
  targetId: string,
  direction: SplitDirection,
): { newRoot: PaneNode; newLeafId: string } {
  const newLeafId = generatePaneId();
  const newRoot = mapNode(root, (node) => {
    if (node.type === "leaf" && node.id === targetId) {
      return {
        type: "split",
        id: generatePaneId(),
        direction,
        ratio: 0.5,
        children: [
          { type: "leaf", id: targetId },
          { type: "leaf", id: newLeafId },
        ],
      } as PaneSplit;
    }
    return node;
  });
  return { newRoot, newLeafId };
}

// Remove a leaf and promote its sibling
export function removeLeaf(root: PaneNode, targetId: string): PaneNode {
  return mapNode(root, (node) => {
    if (node.type === "split") {
      const [a, b] = node.children;
      if (a.type === "leaf" && a.id === targetId) return b;
      if (b.type === "leaf" && b.id === targetId) return a;
    }
    return node;
  });
}

// Update split ratio
export function updateRatio(root: PaneNode, splitId: string, ratio: number): PaneNode {
  return mapNode(root, (node) => {
    if (node.type === "split" && node.id === splitId) {
      return { ...node, ratio };
    }
    return node;
  });
}
