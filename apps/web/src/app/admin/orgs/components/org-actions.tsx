"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgActionsProps {
  orgId: string;
  currentPlan: string;
  hasSubscription: boolean;
}

export function OrgActions({ orgId, currentPlan, hasSubscription }: OrgActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePlan(plan: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/billing/change-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to change plan");
      }
      setShowPlanModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this subscription? It will be canceled at the end of the current billing period.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/billing/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atPeriodEnd: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to cancel subscription");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setLoading(false);
    }
  }

  const plans = ["FREE", "PRO", "AGENCY"].filter((p) => p !== currentPlan);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        onClick={() => setShowPlanModal(true)}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "var(--accent-blue)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        Change Plan
      </button>

      {hasSubscription && currentPlan !== "FREE" && (
        <button
          onClick={handleCancel}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "var(--accent-red-muted)",
            color: "var(--accent-red)",
            border: "1px solid var(--accent-red)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Cancel Subscription
        </button>
      )}

      {error && (
        <span style={{ fontSize: 13, color: "var(--accent-red)" }}>{error}</span>
      )}

      {showPlanModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPlanModal(false)}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              padding: 32,
              minWidth: 340,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
              Change Plan
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Current plan: <strong style={{ color: "var(--text-primary)" }}>{currentPlan}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plans.map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleChangePlan(plan)}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    textAlign: "left",
                  }}
                >
                  Switch to {plan}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPlanModal(false)}
              style={{
                marginTop: 16,
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
