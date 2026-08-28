"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { friendlyMessage, listCustomers } from "@/lib/api";
import { formatDate, initialsOf } from "@/lib/format";
import type { Customer, CustomerStatus } from "@/lib/types";
import { useApiResource, useDebouncedValue } from "@/lib/use-api";
import { CustomerOnboardingDialog } from "@/components/customer-onboarding-dialog";
import {
  AlertIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CustomersIcon,
  RefreshIcon,
  SearchIcon,
  UserPlusIcon,
} from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{ value: CustomerStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

type Banner = { tone: "success" | "info"; message: string };

export function CustomersView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "">("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ customer: Customer | null } | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const source = useCallback(
    (signal: AbortSignal) =>
      listCustomers({ page, limit: PAGE_SIZE, status, search: debouncedSearch.trim() }, signal),
    [page, status, debouncedSearch],
  );
  const { data, error, loading, reload } = useApiResource(source);

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const filtered = Boolean(debouncedSearch.trim() || status);

  const range = useMemo(() => {
    if (!pagination || pagination.total === 0) return null;
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(start + rows.length - 1, pagination.total);
    return { start, end, total: pagination.total };
  }, [pagination, rows.length]);

  function resetTo(nextPage: number) {
    setPage(nextPage);
  }

  function handleCustomerChanged(customer: Customer, event: "registered" | "activated") {
    reload();
    setBanner(
      event === "activated"
        ? { tone: "success", message: `${customer.full_name} is verified and active.` }
        : {
            tone: "info",
            message: `${customer.full_name} was registered and is pending verification.`,
          },
    );
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Register customers, verify them by OTP, and review their wallet accounts."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setDialog({ customer: null })}
          >
            <UserPlusIcon className="h-[18px] w-[18px]" />
            Register customer
          </button>
        }
      />

      {banner && (
        <div
          role="status"
          className={`mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed ${
            banner.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-brand-200 bg-brand-50 text-brand-800"
          }`}
        >
          <CheckCircleIcon
            className={`mt-px h-4 w-4 shrink-0 ${
              banner.tone === "success" ? "text-emerald-500" : "text-brand-500"
            }`}
          />
          <span className="flex-1">{banner.message}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="-my-1 -mr-1 rounded p-1 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetTo(1);
              }}
              placeholder="Search name, phone or national ID"
              aria-label="Search customers"
              className="field-input pl-9"
            />
          </div>

          <div className="relative sm:w-48">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as CustomerStatus | "");
                resetTo(1);
              }}
              aria-label="Filter by status"
              className="field-select"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Body */}
        {error ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <AlertIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-800">Could not load customers</p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
              {friendlyMessage(error)}
            </p>
            <button type="button" onClick={reload} className="btn-secondary mt-5">
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-slate-50/60">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Registered
                  </th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className={loading && rows.length > 0 ? "opacity-50 transition-opacity" : ""}>
                {loading && rows.length === 0 &&
                  Array.from({ length: 6 }, (_, index) => (
                    <tr key={index} className="border-b border-line last:border-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                            <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                      </td>
                      <td />
                    </tr>
                  ))}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center px-6 py-14 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <CustomersIcon className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-sm font-medium text-slate-700">
                          {filtered ? "No customers match those filters" : "No customers yet"}
                        </p>
                        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
                          {filtered
                            ? "Try a different search term or clear the status filter."
                            : "Register your first customer to open a wallet for them."}
                        </p>
                        {filtered ? (
                          <button
                            type="button"
                            className="btn-secondary mt-5"
                            onClick={() => {
                              setSearch("");
                              setStatus("");
                              resetTo(1);
                            }}
                          >
                            Clear filters
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary mt-5"
                            onClick={() => setDialog({ customer: null })}
                          >
                            <UserPlusIcon className="h-[18px] w-[18px]" />
                            Register customer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line transition-colors last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-[12px] font-semibold text-navy-800">
                          {initialsOf(row.full_name)}
                        </span>
                        <span className="min-w-0 leading-tight">
                          <Link
                            href={`/customers/${row.id}`}
                            className="block truncate text-sm font-medium text-navy-900 transition hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                          >
                            {row.full_name}
                          </Link>
                          <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">
                            {row.national_id}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[13px] text-slate-600">
                      {row.phone_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-slate-500">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {row.status === "pending" && (
                          <button
                            type="button"
                            className="btn-ghost text-[13px] text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                            onClick={() => setDialog({ customer: row })}
                          >
                            Verify OTP
                          </button>
                        )}
                        <Link
                          href={`/customers/${row.id}`}
                          aria-label={`Open ${row.full_name}`}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!error && pagination && pagination.total > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:justify-between">
            <p className="text-[13px] text-slate-500">
              {range && (
                <>
                  Showing <span className="font-medium text-slate-700">{range.start}</span>–
                  <span className="font-medium text-slate-700">{range.end}</span> of{" "}
                  <span className="font-medium text-slate-700">{range.total}</span>
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary px-2.5 py-2"
                onClick={() => resetTo(Math.max(1, page - 1))}
                disabled={loading || pagination.page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="min-w-[5.5rem] text-center text-[13px] text-slate-500">
                Page <span className="font-medium text-slate-700">{pagination.page}</span> of{" "}
                {Math.max(1, pagination.total_pages)}
              </span>
              <button
                type="button"
                className="btn-secondary px-2.5 py-2"
                onClick={() => resetTo(page + 1)}
                disabled={loading || pagination.page >= pagination.total_pages}
                aria-label="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {dialog && (
        <CustomerOnboardingDialog
          customer={dialog.customer}
          onClose={() => setDialog(null)}
          onCustomerChanged={handleCustomerChanged}
        />
      )}
    </>
  );
}
