"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { friendlyMessage, listCustomers, listCustomerTransactions } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { CustomerWithWallet, Transaction } from "@/lib/types";
import { useApiResource } from "@/lib/use-api";
import {
  AlertIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshIcon,
  SearchIcon,
  TransactionsIcon,
} from "@/components/icons";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

const CUSTOMER_PAGE_SIZE = 100;
const TRANSACTION_FETCH_SIZE = 100;
const TABLE_PAGE_SIZE = 20;

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "DEPOSIT", label: "Deposits" },
  { value: "WITHDRAWAL", label: "Withdrawals" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Completed" },
  { value: "failed", label: "Failed" },
] as const;

type LedgerRow = Transaction & {
  customer_name: string;
  customer_phone: string;
};

type TypeFilter = (typeof TYPE_OPTIONS)[number]["value"];
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

const EMPTY_LEDGER_ROWS: LedgerRow[] = [];

async function loadAllCustomers(signal: AbortSignal): Promise<CustomerWithWallet[]> {
  const first = await listCustomers({ page: 1, limit: CUSTOMER_PAGE_SIZE }, signal);
  const customers = [...first.data];

  const remainingPages = Math.max(0, first.pagination.total_pages - 1);
  if (remainingPages === 0) return customers;

  const pages = await Promise.all(
    Array.from({ length: remainingPages }, (_, index) =>
      listCustomers({ page: index + 2, limit: CUSTOMER_PAGE_SIZE }, signal),
    ),
  );

  for (const page of pages) customers.push(...page.data);
  return customers;
}

async function loadCustomerLedger(
  customer: CustomerWithWallet,
  signal: AbortSignal,
): Promise<LedgerRow[]> {
  const first = await listCustomerTransactions(
    customer.id,
    { page: 1, limit: TRANSACTION_FETCH_SIZE },
    signal,
  );

  const rows = first.data.map((transaction) => ({
    ...transaction,
    customer_name: customer.full_name,
    customer_phone: customer.phone_number,
  }));

  const remainingPages = Math.max(0, first.pagination.total_pages - 1);
  if (remainingPages === 0) return rows;

  const pages = await Promise.all(
    Array.from({ length: remainingPages }, (_, index) =>
      listCustomerTransactions(
        customer.id,
        { page: index + 2, limit: TRANSACTION_FETCH_SIZE },
        signal,
      ),
    ),
  );

  for (const page of pages) {
    rows.push(
      ...page.data.map((transaction) => ({
        ...transaction,
        customer_name: customer.full_name,
        customer_phone: customer.phone_number,
      })),
    );
  }

  return rows;
}

async function loadAllTransactions(signal: AbortSignal): Promise<LedgerRow[]> {
  const customers = await loadAllCustomers(signal);
  if (customers.length === 0) return [];

  const ledgers = await Promise.all(
    customers.map((customer) => loadCustomerLedger(customer, signal)),
  );

  return ledgers
    .flat()
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
}

function TransactionStatusChip({ status }: { status: Transaction["status"] }) {
  const className =
    status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "failed"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-gold-300/70 bg-gold-300/15 text-gold-600";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${className}`}>
      {status}
    </span>
  );
}

function TransactionsTable({
  rows,
  loading,
}: {
  rows: LedgerRow[];
  loading: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-slate-50/60">
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Date
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Customer
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Type
            </th>
            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Amount
            </th>
            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Resulting balance
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody className={loading && rows.length > 0 ? "opacity-50 transition-opacity" : ""}>
          {loading && rows.length === 0 &&
            Array.from({ length: 6 }, (_, index) => (
              <tr key={index} className="border-b border-line last:border-0">
                <td className="px-5 py-4"><div className="h-3 w-32 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-4 w-40 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="ml-auto h-3 w-28 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="ml-auto h-3 w-32 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" /></td>
              </tr>
            ))}

          {rows.map((row) => {
            const deposit = row.type === "DEPOSIT";
            return (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-slate-500">
                  {formatDateTime(row.created_at)}
                  <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                    {row.transaction_ref}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/customers/${row.customer_id}`}
                    className="block text-sm font-medium text-navy-900 transition hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    {row.customer_name}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                    {row.customer_phone}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      deposit
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {deposit ? "Deposit" : "Withdrawal"}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm font-semibold tabular-nums ${
                    deposit ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {deposit ? "+" : "-"}
                  {formatMoney(row.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm text-navy-900 tabular-nums">
                  {formatMoney(row.new_balance)}
                </td>
                <td className="px-5 py-3.5">
                  <TransactionStatusChip status={row.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TransactionsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const source = useCallback((signal: AbortSignal) => loadAllTransactions(signal), []);
  const { data, error, loading, reload } = useApiResource(source);

  const rows = data ?? EMPTY_LEDGER_ROWS;
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter && row.type !== typeFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!query) return true;

      return [
        row.customer_name,
        row.customer_phone,
        row.customer_id,
        row.transaction_ref,
        row.amount,
        row.new_balance,
        row.status,
        row.type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search, statusFilter, typeFilter]);
  const filtered = Boolean(search.trim() || typeFilter || statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / TABLE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * TABLE_PAGE_SIZE, currentPage * TABLE_PAGE_SIZE),
    [currentPage, filteredRows],
  );
  const rangeStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * TABLE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * TABLE_PAGE_SIZE, filteredRows.length);

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="All customer wallet movements merged into one ledger."
        action={
          <button type="button" className="btn-secondary" onClick={reload} disabled={loading}>
            <RefreshIcon className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <Panel title="All Transactions" description="Built from each customer's transaction statement.">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search customer, phone or reference"
              aria-label="Search transactions"
              className="field-input pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as TypeFilter);
                  setPage(1);
                }}
                aria-label="Filter by transaction type"
                className="field-select"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setPage(1);
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
        </div>

        {error ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <AlertIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-800">Could not load transactions</p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
              {friendlyMessage(error)}
            </p>
            <button type="button" onClick={reload} className="btn-secondary mt-5">
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : rows.length === 0 && !loading ? (
          <div className="p-5">
            <EmptyState
              icon={TransactionsIcon}
              title="No transactions to show yet"
              body="Once a customer receives a deposit or completes a withdrawal, it will appear here."
            />
          </div>
        ) : filteredRows.length === 0 && !loading ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <TransactionsIcon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-700">No transactions match those filters</p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
              Try a different search term, type, or status.
            </p>
            {filtered && (
              <button type="button" className="btn-secondary mt-5" onClick={resetFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <TransactionsTable rows={pagedRows} loading={loading} />
            {filteredRows.length > 0 && (
              <div className="flex flex-col items-center gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:justify-between">
                <p className="text-[13px] text-slate-500">
                  Showing <span className="font-medium text-slate-700">{rangeStart}</span>
                  {"-"}
                  <span className="font-medium text-slate-700">{rangeEnd}</span> of{" "}
                  <span className="font-medium text-slate-700">{filteredRows.length}</span>
                  {filtered && (
                    <>
                      {" "}
                      filtered from <span className="font-medium text-slate-700">{rows.length}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-2.5 py-2"
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={loading || currentPage <= 1}
                    aria-label="Previous transaction page"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="min-w-[5.5rem] text-center text-[13px] text-slate-500">
                    Page <span className="font-medium text-slate-700">{currentPage}</span> of{" "}
                    {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary px-2.5 py-2"
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={loading || currentPage >= totalPages}
                    aria-label="Next transaction page"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
