"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserActions({ userId, userEmail, status }: { userId: string; userEmail: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function performAction(action: string, method = "POST", confirmMsg?: string) {
    if (!confirm(confirmMsg ?? `Are you sure you want to ${action.replace("-", " ")} this user?`)) return;
    setLoading(action);
    try {
      const url = action === "delete"
        ? `/api/admin/users/${userId}`
        : `/api/admin/users/${userId}/${action}`;
      const res = await fetch(url, { method });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Action failed");
      } else {
        if (action === "reset-password" && data.data?.resetToken) {
          alert(`Password reset token: ${data.data.resetToken}`);
        }
        if (action === "delete") {
          router.push("/admin/users");
          return;
        }
        router.refresh();
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function resendVerification() {
    setLoading("resend");
    try {
      const res = await fetch(`/api/admin/users/${userId}/resend-verification`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to resend");
      } else {
        alert("Verification email sent to " + userEmail);
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function activateUser() {
    setLoading("activate");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE", emailVerified: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to activate");
      } else {
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
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {status === "PENDING_VERIFICATION" && (
        <>
          <button
            style={btnStyle("#3b82f6")}
            onClick={activateUser}
            disabled={!!loading}
          >
            {loading === "activate" ? "..." : "Activate Now"}
          </button>
          <button
            style={btnStyle("#6b4fbb")}
            onClick={resendVerification}
            disabled={!!loading}
          >
            {loading === "resend" ? "..." : "Resend Verification"}
          </button>
        </>
      )}
      {status !== "SUSPENDED" && status !== "PENDING_VERIFICATION" && (
        <button
          style={btnStyle("#e5a100")}
          onClick={() => performAction("suspend")}
          disabled={!!loading}
        >
          {loading === "suspend" ? "..." : "Suspend"}
        </button>
      )}
      {status === "SUSPENDED" && (
        <button
          style={btnStyle("#3b82f6")}
          onClick={activateUser}
          disabled={!!loading}
        >
          {loading === "activate" ? "..." : "Unsuspend"}
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
      <button
        style={btnStyle("#71717a")}
        onClick={() => performAction("delete", "DELETE", "PERMANENTLY delete this user? This cannot be undone.")}
        disabled={!!loading}
      >
        {loading === "delete" ? "..." : "Delete User"}
      </button>
    </div>
  );
}
