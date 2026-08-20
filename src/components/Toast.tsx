"use client";

import { useApp } from "@/lib/store";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

export function Toast() {
  const toast = useApp((s) => s.toast);
  const clear = useApp((s) => s.clearToast);
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? XCircle : Info;
  const color =
    toast.type === "success" ? "text-emerald-400" : toast.type === "error" ? "text-red-400" : "text-blue-400";
  return (
    <div className={`toast toast-${toast.type}`}>
      <Icon className={`w-5 h-5 shrink-0 ${color}`} />
      <span className="text-sm flex-1">{toast.message}</span>
      <button className="btn-ghost btn-icon" onClick={clear} aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
