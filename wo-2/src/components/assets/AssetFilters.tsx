"use client";

import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { assetCategories, assetStatuses } from "@/lib/asset-schemas";

export interface FilterState {
  search: string;
  category: string;
  status: string;
  location: string;
  pic: string;
}

interface AssetFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  availableLocations: string[];
  totalResults: number;
}

export function AssetFilters({
  filters,
  onChange,
  onReset,
  availableLocations,
  totalResults,
}: AssetFiltersProps) {
  const activeCount = [
    filters.search,
    filters.category,
    filters.status,
    filters.location,
    filters.pic,
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 shadow-sm space-y-3">
      {/* Top row: Search input & quick stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Cari Nama Aset, Serial Number, atau Tag AST (mis: AST-2026-001)..."
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all placeholder:text-muted-foreground"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
              title="Hapus pencarian"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-muted-foreground px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium">
            Ditemukan:{" "}
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {totalResults}
            </span>{" "}
            aset
          </div>
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 transition-colors"
              title="Reset seluruh filter"
            >
              <RotateCcw size={13} />
              Reset ({activeCount})
            </button>
          )}
        </div>
      </div>

      {/* Second row: Dropdown filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Kategori
          </label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
          >
            <option value="">Semua Kategori</option>
            {assetCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Status Operasional
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
          >
            <option value="">Semua Status</option>
            {assetStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            Lokasi Penempatan
          </label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium truncate"
          >
            <option value="">Semua Lokasi</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* PIC Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
            PIC Penanggung Jawab
          </label>
          <input
            type="text"
            value={filters.pic}
            onChange={(e) => onChange({ ...filters, pic: e.target.value })}
            placeholder="Ketik nama PIC..."
            className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
