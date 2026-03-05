import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

interface DropdownPopupProps {
  children: ReactNode;
  onClose: () => void;
  style?: CSSProperties;
}

export default function DropdownPopup({ children, onClose, style }: DropdownPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest("[data-topbar-trigger]")) return;
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg), inset 0 1px 0 var(--glass-shine)",
        padding: 16,
        zIndex: 100,
        animation: "scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        transformOrigin: "top center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
