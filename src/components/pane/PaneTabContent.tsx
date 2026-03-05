import type { PaneTab } from "@/lib/types";
import TerminalContent from "@/components/pane/TerminalContent";
import FileViewer from "@/components/editor/FileViewer";

interface PaneTabContentProps {
  tab: PaneTab;
  isActive: boolean;
}

export default function PaneTabContent({ tab, isActive }: PaneTabContentProps) {
  switch (tab.type) {
    case "terminal":
      return <TerminalContent terminalTabId={tab.terminalTabId || ""} isActive={isActive} />;
    case "editor":
      return <FileViewer />;
    default:
      return null;
  }
}
