"use client";

import React from "react";
import { Shield, RefreshCw } from "lucide-react";
import { UserRolePermission } from "@/types/asset";

interface StateSimulatorBarProps {
  userRole: UserRolePermission;
  onRoleChange: (role: UserRolePermission) => void;
  isLoading: boolean;
  onToggleLoading: () => void;
  isSkeleton: boolean;
  onToggleSkeleton: () => void;
  isError: boolean;
  onToggleError: () => void;
  isEmptySimulated: boolean;
  onToggleEmpty: () => void;
  onResetData: () => void;
}

export function StateSimulatorBar({
  userRole,
  onRoleChange,
  isLoading,
  onToggleLoading,
  isSkeleton,
  onToggleSkeleton,
  isError,
  onToggleError,
  isEmptySimulated,
  onToggleEmpty,
  onResetData,
}: StateSimulatorBarProps) {
  return (
    <div className="bg-zinc-900 text-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 mb-6 shadow-md border border-zinc-800">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
        {/* Left: Role switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-zinc-300 text-[11px] uppercase tracking-wider">
            <Shield size={14} className="text-purple-400" />
            Role Akses (SOP Permission):
          </span>
          <div className="inline-flex rounded-xl bg-zinc-800 p-0.5 border border-zinc-700">
            <button
              onClick={() => onRoleChange("head_it")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                userRole === "head_it"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Head of IT
            </button>
            <button
              onClick={() => onRoleChange("it_support")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                userRole === "it_support"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              IT Support
            </button>
            <button
              onClick={() => onRoleChange("employee")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                userRole === "employee"
                  ? "bg-zinc-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Employee (Read-Only)
            </button>
          </div>
        </div>

        {/* Right: State simulation buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mr-1">
            Uji 8 SOP State:
          </span>

          <button
            onClick={onToggleLoading}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              isLoading
                ? "bg-amber-500 text-black border-amber-400 font-bold"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            Loading {isLoading && "✓"}
          </button>

          <button
            onClick={onToggleSkeleton}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              isSkeleton
                ? "bg-blue-500 text-white border-blue-400 font-bold"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            Skeleton {isSkeleton && "✓"}
          </button>

          <button
            onClick={onToggleError}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              isError
                ? "bg-red-600 text-white border-red-500 font-bold"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            Error State {isError && "✓"}
          </button>

          <button
            onClick={onToggleEmpty}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              isEmptySimulated
                ? "bg-purple-600 text-white border-purple-500 font-bold"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            Empty State {isEmptySimulated && "✓"}
          </button>

          <button
            onClick={onResetData}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-700 transition-colors inline-flex items-center gap-1"
            title="Reset Mock Data Store ke Nilai Awal"
          >
            <RefreshCw size={11} /> Reset Data
          </button>
        </div>
      </div>
    </div>
  );
}
