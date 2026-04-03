"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserActions({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function performAction(action: "suspend" | "ban" | "reset-password") {
    if (!confirm(`Are you sure you want to ${action.replace("-", " ")} this user?`)) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Action failed");
      } else {
        if (action === "reset-password" && data.data?.resetToken) {
          alert(`Password reset token: ${data.data.resetToken}`);
        }
        router.refresh();
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  }

  const btnStyle = (bg: string): React.CSSProperties => ({
    padding: "6px 14px",
    fontSize: 13,
    borderRadius: 6,
    border: "none",
    background: bg,
    color: "#fff",
    fontWeight: 500,
    cursor: "pointer",
    opacity: loading ? 0.6 : 1,
  });

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {status !== "SUSPENDED" && (
        <button
          style={btnStyle("#e5a100")}
          onClick={() => performAction("suspend")}
          disabled={!!loading}
        >
          {loading === "suspend" ? "..." : "Suspend"}
        </button>
      )}
      {status !== "BANNED" && (
        <button
          style={btnStyle("#e5484d")}
          onClick={() => performAction("ban")}
          disabled={!!loading}
        >
          {loading === "ban" ? "..." : "Ban"}
        </button>
      )}
      <button
        style={btnStyle("#6b4fbb")}
        onClick={() => performAction("reset-password")}
        disabled={!!loading}
      >
        {loading === "reset-password" ? "..." : "Reset Password"}
      </button>
    </div>
  );
}
