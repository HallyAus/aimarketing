"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

/* ── Types ─────────────────────────────────────────────────────── */

interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
}

interface PasskeyInfo {
  credentialID: string;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function SecuritySettingsPage() {
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 2FA Setup flow
  const [showSetup, setShowSetup] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  // 2FA Disable flow
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Passkey register
  const [registerLoading, setRegisterLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const [tfRes, pkRes] = await Promise.all([
        fetch("/api/auth/2fa/setup").catch(() => null),
        fetch("/api/auth/passkey/register").catch(() => null),
      ]);

      // Check 2FA status by trying to get current state
      // We'll use a simple GET to our own session
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        // Check DB for 2FA status
        const checkRes = await fetch("/api/user/preferences");
        if (checkRes.ok) {
          const prefs = await checkRes.json();
          setTwoFactor({
            enabled: prefs.twoFactorEnabled ?? false,
            enabledAt: prefs.twoFactorEnabledAt ?? null,
          });
        }
      }

      // Fetch passkeys
      const pkListRes = await fetch("/api/auth/passkey/list");
      if (pkListRes.ok) {
        const data = await pkListRes.json();
        setPasskeys(data.passkeys ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  /* ── 2FA Setup ─────────────────────────────────────────────── */

  async function startSetup() {
    setSetupLoading(true);
    setSetupError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setSetupError(data.error || "Failed to start setup");
        return;
      }
      const data = await res.json();
      setQrDataUrl(data.qrDataUrl);
      setBackupCodes(data.backupCodes);
      setSetupStep("qr");
      setShowSetup(true);
    } catch {
      setSetupError("Network error");
    } finally {
      setSetupLoading(false);
    }
  }

  async function verifySetup() {
    if (!verifyCode || verifyCode.length !== 6) {
      setSetupError("Enter a 6-digit code from your authenticator app");
      return;
    }
    setSetupLoading(true);
    setSetupError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSetupError(data.error || "Invalid code");
        return;
      }
      setSetupStep("backup");
    } catch {
      setSetupError("Network error");
    } finally {
      setSetupLoading(false);
    }
  }

  function finishSetup() {
    setShowSetup(false);
    setVerifyCode("");
    setTwoFactor({ enabled: true, enabledAt: new Date().toISOString() });
    setSuccessMsg("Two-factor authentication enabled");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  /* ── 2FA Disable ───────────────────────────────────────────── */

  async function confirmDisable() {
    if (!disablePassword) {
      setDisableError("Enter your password to confirm");
      return;
    }
    setDisableLoading(true);
    setDisableError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDisableError(data.error || "Failed to disable");
        return;
      }
      setShowDisable(false);
      setDisablePassword("");
      setTwoFactor({ enabled: false, enabledAt: null });
      setSuccessMsg("Two-factor authentication disabled");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setDisableError("Network error");
    } finally {
      setDisableLoading(false);
    }
  }

  /* ── Passkey Registration ──────────────────────────────────── */

  async function registerPasskey() {
    setRegisterLoading(true);
    try {
      // 1. Get registration options
      const optRes = await fetch("/api/auth/passkey/register", { method: "POST" });
      if (!optRes.ok) throw new Error("Failed to get options");
      const options = await optRes.json();

      // 2. Start browser registration
      const { startRegistration } = await import("@simplewebauthn/browser");
      const attResp = await startRegistration(options);

      // 3. Verify with server
      const verRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attResp),
      });
      if (!verRes.ok) throw new Error("Verification failed");

      setSuccessMsg("Passkey registered successfully");
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchStatus(); // refresh list
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : "Passkey registration failed");
      setTimeout(() => setSetupError(""), 4000);
    } finally {
      setRegisterLoading(false);
    }
  }

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title="Security"
        subtitle="Manage two-factor authentication, passkeys, and sign-in methods"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Security" },
        ]}
      />

      {successMsg && <div className="alert alert-success mb-4">{successMsg}</div>}
      {setupError && !showSetup && <div className="alert alert-error mb-4">{setupError}</div>}

      {loading ? (
        <div className="space-y-4">
          <div className="card h-32 skeleton" />
          <div className="card h-32 skeleton" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Two-Factor Authentication ──────────────────── */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  Two-Factor Authentication
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  Add an extra layer of security by requiring a code from your authenticator app when signing in.
                </p>
                {twoFactor?.enabled && twoFactor.enabledAt && (
                  <p className="text-xs mt-2" style={{ color: "var(--accent-emerald)" }}>
                    Enabled since {new Date(twoFactor.enabledAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                {twoFactor?.enabled ? (
                  <button onClick={() => setShowDisable(true)} className="btn-danger text-sm">
                    Disable 2FA
                  </button>
                ) : (
                  <button onClick={startSetup} disabled={setupLoading} className="btn-primary text-sm">
                    {setupLoading ? "Setting up..." : "Enable 2FA"}
                  </button>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: twoFactor?.enabled ? "var(--accent-emerald)" : "var(--text-tertiary)" }}
              />
              <span className="text-xs font-medium" style={{ color: twoFactor?.enabled ? "var(--accent-emerald)" : "var(--text-tertiary)" }}>
                {twoFactor?.enabled ? "Active" : "Not enabled"}
              </span>
            </div>
          </div>

          {/* ── Passkeys ──────────────────────────────────── */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  Passkeys
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  Sign in with your fingerprint, face, or device PIN. Passkeys are more secure than passwords.
                </p>
              </div>
              <button onClick={registerPasskey} disabled={registerLoading} className="btn-primary text-sm">
                {registerLoading ? "Registering..." : "Add Passkey"}
              </button>
            </div>

            {passkeys.length > 0 ? (
              <div className="mt-4 space-y-2">
                {passkeys.map((pk, i) => (
                  <div
                    key={pk.credentialID}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
                  >
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-blue)" }}>
                        <path d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          Passkey {i + 1}
                        </span>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-primary)", color: "var(--text-tertiary)" }}>
                            {pk.credentialDeviceType === "singleDevice" ? "This device" : "Multi-device"}
                          </span>
                          {pk.credentialBackedUp && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-emerald-muted)", color: "var(--accent-emerald)" }}>
                              Backed up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
                No passkeys registered yet.
              </p>
            )}
          </div>

          {/* ── Sign-in Methods ───────────────────────────── */}
          <div className="card">
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Sign-in Methods
            </h2>
            <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
              Available ways to sign in to your account.
            </p>
            <div className="space-y-3">
              {[
                { label: "Email & Password", status: "Active", icon: "M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" },
                { label: "Magic Link (Email)", status: "Available", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { label: "Passkey / Biometric", status: passkeys.length > 0 ? "Active" : "Available", icon: "M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268" },
              ].map((method) => (
                <div
                  key={method.label}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ border: "1px solid var(--border-primary)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
                    <path d={method.icon} />
                  </svg>
                  <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{method.label}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{
                      background: method.status === "Active" ? "var(--accent-emerald-muted)" : "var(--bg-tertiary)",
                      color: method.status === "Active" ? "var(--accent-emerald)" : "var(--text-tertiary)",
                    }}
                  >
                    {method.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2FA Setup Modal ──────────────────────────────── */}
      {showSetup && (
        <div className="modal-overlay" onClick={() => { if (setupStep !== "backup") setShowSetup(false); }}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            {setupStep === "qr" && (
              <>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Scan QR Code
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                </p>
                {qrDataUrl && (
                  <div className="flex justify-center mb-4">
                    <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48 rounded-lg" style={{ background: "#fff", padding: 8 }} />
                  </div>
                )}
                <button onClick={() => setSetupStep("verify")} className="btn-primary w-full">
                  I have scanned the code
                </button>
              </>
            )}

            {setupStep === "verify" && (
              <>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Verify Code
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Enter the 6-digit code from your authenticator app to confirm setup.
                </p>
                {setupError && <div className="alert alert-error mb-3 text-sm">{setupError}</div>}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && verifySetup()}
                />
                <div className="flex gap-2">
                  <button onClick={() => setSetupStep("qr")} className="btn-secondary flex-1">Back</button>
                  <button onClick={verifySetup} disabled={setupLoading || verifyCode.length !== 6} className="btn-primary flex-1">
                    {setupLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </>
            )}

            {setupStep === "backup" && (
              <>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Save Backup Codes
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Save these backup codes in a safe place. Each code can only be used once if you lose access to your authenticator.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="text-center py-2 rounded font-mono text-sm"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join("\n"));
                    setSuccessMsg("Backup codes copied");
                    setTimeout(() => setSuccessMsg(""), 2000);
                  }}
                  className="btn-secondary w-full mb-3 text-sm"
                >
                  Copy All Codes
                </button>
                <button onClick={finishSetup} className="btn-primary w-full">
                  I have saved my codes
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Disable 2FA Modal ────────────────────────────── */}
      {showDisable && (
        <div className="modal-overlay" onClick={() => setShowDisable(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Disable Two-Factor Authentication
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Enter your password to confirm. This will remove the extra security layer from your account.
            </p>
            {disableError && <div className="alert alert-error mb-3 text-sm">{disableError}</div>}
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full mb-4"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmDisable()}
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowDisable(false); setDisablePassword(""); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmDisable} disabled={disableLoading || !disablePassword} className="btn-danger flex-1">
                {disableLoading ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
