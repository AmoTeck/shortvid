"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Clapperboard, LogIn, UserPlus } from "lucide-react";

export function AuthModal() {
  const mode = useApp((s) => s.authMode);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const login = useApp((s) => s.login);
  const register = useApp((s) => s.register);
  const session = useApp((s) => s.session);

  const [username, setUsername] = useState("amoteck");
  const [password, setPassword] = useState("storycinema");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  if (session || !mode) return null;

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "login") await login(username, password);
      else
        await register({
          username,
          password,
          displayName: displayName || username,
          email,
        });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div className="card w-full sm:max-w-md shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[95vh] overflow-y-auto">
        <div className="card-body space-y-5 py-8">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Clapperboard className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black glow-text">StoryCinema</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Your private studio · projects stay on this device
            </p>
          </div>

          <div className="tab-bar">
            <button
              className={`tab flex-1 ${mode === "login" ? "active" : ""}`}
              onClick={() => setAuthMode("login")}
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button
              className={`tab flex-1 ${mode === "register" ? "active" : ""}`}
              onClick={() => setAuthMode("register")}
            >
              <UserPlus className="w-4 h-4" /> Register
            </button>
          </div>

          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              inputMode="text"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {mode === "register" && (
            <>
              <div className="field">
                <label>Display name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="field">
                <label>Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                />
              </div>
            </>
          )}

          <button className="btn btn-primary btn-lg w-full" disabled={busy} onClick={submit}>
            {busy ? "Please wait…" : mode === "login" ? "Enter Studio" : "Create Account"}
          </button>

          {mode === "login" && (
            <div className="text-xs text-center text-[var(--color-text-dim)] leading-relaxed bg-[var(--color-bg-elevated)] rounded-xl p-3 border border-[var(--color-border)]">
              <strong className="text-[var(--color-text-muted)]">Your account is ready:</strong>
              <br />
              Username: <code className="text-indigo-300">amoteck</code>
              <br />
              Password: <code className="text-indigo-300">storycinema</code>
              <br />
              <span className="opacity-80">Change it anytime after login in Settings.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
