import type { PaneNode } from "@/lib/types";
import PaneLeafContainer from "@/components/pane/PaneLeafContainer";
import SplitHandle from "./SplitHandle";

interface PaneContainerProps {
  node: PaneNode;
}

export default function PaneContainer({ node }: PaneContainerProps) {
  if (node.type === "leaf") {
    return <PaneLeafContainer key={node.id} paneId={node.id} />;
  }

  const isVertical = node.direction === "vertical";

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: isVertical ? "row" : "column",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div
        style={{
          flex: `0 0 calc(${node.ratio * 100}% - 6px)`,
          display: "flex",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <PaneContainer key={node.children[0].id} node={node.children[0]} />
      </div>

      <SplitHandle splitId={node.id} direction={node.direction} />

      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <PaneContainer key={node.children[1].id} node={node.children[1]} />
      </div>
    </div>
  );
}
