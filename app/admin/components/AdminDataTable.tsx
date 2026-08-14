"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

/** When set, `data` is assumed to already be exactly one page's worth of rows fetched from the
 * server for `page` — the table stops slicing/paginating locally and defers page navigation to
 * `onPageChange`. Without this, the table falls back to its original local-pagination behavior
 * (fine for small, fully-loaded arrays like Roles/Categories, wrong for anything using the
 * backend's `Paginated<T>` envelope, which only ever returns one page at a time). */
export interface ServerPagination {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface AdminDataTableProps<T extends { id: string }> {
  title: string;
  description?: string;
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  onBulkVerify?: (selectedIds: string[]) => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  onExportCsv?: () => void;
  actionButton?: React.ReactNode;
  serverPagination?: ServerPagination;
  /** Extra filter controls (checkboxes, selects, ...) rendered inline next to the search box —
   * caller owns the filter state and just passes the already-styled controls in. */
  extraFilters?: React.ReactNode;
}

export function AdminDataTable<T extends { id: string }>({
  title,
  description,
  columns,
  data,
  searchPlaceholder = "Search records...",
  onSearchChange,
  onBulkVerify,
  onBulkDelete,
  onExportCsv,
  actionButton,
  serverPagination,
  extraFilters,
}: AdminDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Server-paginated mode: `data` is already the current page, search is delegated upstream —
  // don't re-filter/re-slice a page the server already narrowed down.
  const filteredData = serverPagination || onSearchChange
    ? data
    : data.filter((row) =>
        Object.values(row).some(
          (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

  const totalPages = serverPagination ? serverPagination.totalPages : Math.ceil(filteredData.length / pageSize) || 1;
  const displayPage = serverPagination ? serverPagination.page : currentPage;
  const totalCount = serverPagination ? serverPagination.total : filteredData.length;
  const paginatedData = serverPagination
    ? filteredData
    : filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (updater: (p: number) => number) => {
    if (serverPagination) {
      serverPagination.onPageChange(updater(serverPagination.page));
    } else {
      setCurrentPage(updater);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((d) => d.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden space-y-0">
      {/* TABLE TOP BAR */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090d16]">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-[10px] font-extrabold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
              {totalCount.toLocaleString()} Records
            </span>
          </h2>
          {description && (
            <p className="text-xs text-slate-400 font-medium leading-relaxed pt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* SEARCH & GLOBAL TABLE ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
                onSearchChange?.(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all w-52 sm:w-64"
            />
          </div>

          {extraFilters}

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-extrabold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export CSV</span>
            </button>
          )}

          {actionButton}
        </div>
      </div>

      {/* BULK SELECTION ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="px-6 py-2.5 bg-purple-950/40 border-b border-purple-800/40 flex items-center justify-between text-xs text-purple-200 animate-in fade-in duration-150">
          <span className="font-bold">
            {selectedIds.length} item(s) selected
          </span>

          <div className="flex items-center gap-2">
            {onBulkVerify && (
              <button
                onClick={() => onBulkVerify(selectedIds)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bulk Verify</span>
              </button>
            )}

            {onBulkDelete && (
              <button
                onClick={() => onBulkDelete(selectedIds)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bulk Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TABLE DATA CONTAINER */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#070a12] text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800/80">
            <tr>
              <th className="p-4 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-purple-400 transition-colors"
                >
                  {selectedIds.length === paginatedData.length && paginatedData.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              {columns.map((col, i) => (
                <th key={i} className="p-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-slate-900/50 transition-colors group",
                      isSelected && "bg-purple-950/20"
                    )}
                  >
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleSelectRow(row.id)}
                        className="text-slate-500 hover:text-purple-400 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {columns.map((col, idx) => (
                      <td key={idx} className="p-4">
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? "")
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 font-semibold">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER & PAGINATION */}
      <div className="p-4 bg-[#090d16] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
        <span>
          Showing Page {displayPage} of {totalPages} ({totalCount.toLocaleString()} Total)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage((p) => Math.max(p - 1, 1))}
            disabled={displayPage === 1}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goToPage((p) => Math.min(p + 1, totalPages))}
            disabled={displayPage === totalPages}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
