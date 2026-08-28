"use client";

import { useCallback } from "react";
import { friendlyMessage, getDashboard } from "@/lib/api";
import { formatCount, formatDateTime, formatMoney } from "@/lib/format";
import type { DashboardMetrics, FlatDashboardMetrics, Transaction } from "@/lib/types";
import { useApiResource } from "@/lib/use-api";
import {
  AlertIcon,
  CustomersIcon,
  LedgerIcon,
  RefreshIcon,
  ShieldIcon,
  TransactionsIcon,
  WalletIcon,
} from "@/components/icons";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/ui";

function normalizeDashboard(data: DashboardMetrics | FlatDashboardMetrics | null) {
  if (!data) return null;

  if ("customers" in data) {
    return {
      totalCustomers: data.customers.total,
      activeCustomers: data.customers.active,
      pendingCustomers: data.customers.pending,
      blockedCustomers: data.customers.blocked,
      totalDeposits: data.transactions.total_deposited,
      totalWithdrawals: data.transactions.total_withdrawn,
      depositCount: data.transactions.deposit_count,
      withdrawalCount: data.transactions.withdrawal_count,
      totalBalance: data.wallets.total_balance,
      recentTransactions: data.transactions.recent,
    };
  }

  return {
    totalCustomers: data.total_customers,
    activeCustomers: data.active_customers,
    pendingCustomers: null,
    blockedCustomers: null,
    totalDeposits: data.total_deposits,
    totalWithdrawals: data.total_withdrawals,
    depositCount: null,
    withdrawalCount: null,
    totalBalance: data.total_balance,
    recentTransactions: data.last_transactions ?? [],
  };
}

function RecentActivityTable({
  transactions,
  loading,
}: {
  transactions: Transaction[];
  loading: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
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
              Balance
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }, (_, index) => (
              <tr key={index} className="border-b border-line last:border-0">
                <td className="px-5 py-4"><div className="h-3 w-32 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-3 w-28 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="ml-auto h-3 w-28 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="ml-auto h-3 w-32 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" /></td>
              </tr>
            ))}
          {transactions.map((transaction) => {
            const deposit = transaction.type === "DEPOSIT";
            return (
              <tr
                key={transaction.id}
                className="border-b border-line last:border-0 hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-slate-500">
                  {formatDateTime(transaction.created_at)}
                  <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                    {transaction.transaction_ref}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[12px] text-slate-500">
                  {transaction.customer_id}
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
                  {formatMoney(transaction.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm text-navy-900 tabular-nums">
                  {formatMoney(transaction.new_balance)}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex rounded-full border border-line bg-slate-50 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                    {transaction.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardView() {
  const source = useCallback((signal: AbortSignal) => getDashboard(signal), []);
  const { data, error, loading, reload } = useApiResource(source);

  const failed = Boolean(error);
  const unavailable = !data;
  const metrics = normalizeDashboard(data);

  const tiles = [
    {
      label: "Total Customers",
      value: formatCount(metrics?.totalCustomers),
      hint:
        metrics?.pendingCustomers === null || metrics?.pendingCustomers === undefined
          ? undefined
          : `${formatCount(metrics.pendingCustomers)} pending`,
      icon: CustomersIcon,
    },
    {
      label: "Active Customers",
      value: formatCount(metrics?.activeCustomers),
      hint:
        metrics?.blockedCustomers === null || metrics?.blockedCustomers === undefined
          ? undefined
          : `${formatCount(metrics.blockedCustomers)} blocked`,
      icon: ShieldIcon,
    },
    {
      label: "Total Deposits",
      value: formatMoney(metrics?.totalDeposits),
      hint:
        metrics?.depositCount === null || metrics?.depositCount === undefined
          ? undefined
          : `${formatCount(metrics.depositCount)} transactions`,
      icon: LedgerIcon,
    },
    {
      label: "Total Withdrawals",
      value: formatMoney(metrics?.totalWithdrawals),
      hint:
        metrics?.withdrawalCount === null || metrics?.withdrawalCount === undefined
          ? undefined
          : `${formatCount(metrics.withdrawalCount)} transactions`,
      icon: TransactionsIcon,
    },
    {
      label: "Total Balance",
      value: formatMoney(metrics?.totalBalance),
      hint: "Held across all wallets",
      icon: WalletIcon,
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of customers, balances and money movement across the platform."
      />


      {failed && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] leading-relaxed text-rose-800"
        >
          <AlertIcon className="mt-px h-4 w-4 shrink-0 text-rose-500" />
          <span className="flex-1">{friendlyMessage(error)}</span>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((tile) => (
          <StatCard
            key={tile.label}
            {...tile}
            loading={loading && unavailable && !error}
            unavailable={unavailable && !loading}
          />
        ))}
      </div>

      <div className="mt-6">
        <Panel
          title="Recent Activity"
          description="The ten most recent movements across all wallets."
        >
          {loading && !data ? (
            <RecentActivityTable transactions={[]} loading />
          ) : metrics?.recentTransactions.length ? (
            <RecentActivityTable transactions={metrics.recentTransactions.slice(0, 10)} loading={false} />
          ) : (
            <div className="p-5">
              <EmptyState
                icon={TransactionsIcon}
                title="No transactions to show yet"
                body="Deposits and withdrawals will appear here as they happen."
              />
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
