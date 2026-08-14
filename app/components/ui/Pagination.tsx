"use client";

import { cn } from "@/app/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2 py-6", className)}>
      {/* Prev Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] border border-border-light text-secondary-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border-light disabled:hover:text-secondary-600 transition-colors cursor-pointer"
        aria-label="Previous Page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Pages */}
      {Array.from({ length: totalPages }).map((_, i) => {
        const pageNum = i + 1;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "w-9 h-9 text-sm font-semibold rounded-[var(--radius-md)] transition-all cursor-pointer",
              isActive
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-secondary-600 border border-border-light hover:border-primary-200 hover:text-primary"
            )}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] border border-border-light text-secondary-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border-light disabled:hover:text-secondary-600 transition-colors cursor-pointer"
        aria-label="Next Page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
