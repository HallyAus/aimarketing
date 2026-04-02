"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "adpilot-sidebar-collapsed";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {}
    setMounted(true);

    // Listen for storage changes (sidebar toggle updates localStorage)
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setCollapsed(stored === "true");
      } catch {}
    };

    // Custom event for same-tab updates
    window.addEventListener("sidebar-toggle", handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("sidebar-toggle", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen transition-[padding] duration-200 ease-in-out ${
        mounted
          ? collapsed
            ? "md:pl-16"
            : "md:pl-60"
          : "md:pl-60"
      }`}
    >
      {children}
    </div>
  );
}
