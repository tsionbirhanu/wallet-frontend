"use client";

import { type FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  confirmWithdrawal,
  depositToCustomer,
  friendlyMessage,
  getCustomer,
  isApiError,
  listCustomerTransactions,
  requestWithdrawalOtp,
  setCustomerPin,
  updateCustomerStatus,
} from "@/lib/api";
import { formatDateTime, formatMoney, initialsOf } from "@/lib/format";
import type { Customer, Transaction } from "@/lib/types";
import { useApiResource } from "@/lib/use-api";
import { CustomerOnboardingDialog } from "@/components/customer-onboarding-dialog";
import { Modal } from "@/components/modal";
import { OtpInput } from "@/components/otp-input";
import {
  AlertIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  IdCardIcon,
  PhoneIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  SpinnerIcon,
  TransactionsIcon,
} from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, Panel } from "@/components/ui";

type Tab = "overview" | "transactions";
type MoneyDialog = "deposit" | "withdraw" | "reset-pin";
type StatusDialogMode = "block" | "activate";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "transactions", label: "Transactions" },
];

const TRANSACTION_PAGE_SIZE = 10;

function amountForApi(raw: string): string {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return "";
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value.toFixed(2) : "";
}

function cleanAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
}

function transactionTone(transaction: Transaction): {
  sign: string;
  amountClass: string;
  pillClass: string;
} {
  if (transaction.type === "DEPOSIT") {
    return {
      sign: "+",
      amountClass: "text-emerald-700",
      pillClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  return {
    sign: "-",
    amountClass: "text-rose-700",
    pillClass: "border-rose-200 bg-rose-50 text-rose-700",
  };
}

function BackLink() {
  return (
    <Link
      href="/customers"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      All customers
    </Link>
  );
}

function DetailRow({
  icon: RowIcon,
  label,
  value,
  mono = false,
}: {
  icon: typeof PhoneIcon;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <RowIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
          {label}
        </span>
        <span
          className={`mt-1 block break-words text-sm text-slate-800 ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      </span>
    </div>
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

function TransactionTable({
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
        <tbody className={loading && transactions.length > 0 ? "opacity-50 transition-opacity" : ""}>
          {loading && transactions.length === 0 &&
            Array.from({ length: 5 }, (_, index) => (
              <tr key={index} className="border-b border-line last:border-0">
                <td className="px-5 py-4"><div className="h-3 w-32 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="ml-auto h-3 w-28 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="ml-auto h-3 w-32 animate-pulse rounded bg-slate-100" /></td>
                <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" /></td>
              </tr>
            ))}
          {transactions.map((transaction) => {
            const tone = transactionTone(transaction);
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
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.pillClass}`}>
                    {transaction.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                  </span>
                </td>
                <td className={`whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm font-semibold tabular-nums ${tone.amountClass}`}>
                  {tone.sign}{formatMoney(transaction.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono text-sm text-navy-900 tabular-nums">
                  {formatMoney(transaction.new_balance)}
                </td>
                <td className="px-5 py-3.5">
                  <TransactionStatusChip status={transaction.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DepositDialog({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: (balance: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const normalized = amountForApi(amount);
    if (!normalized) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await depositToCustomer(customerId, {
        amount: normalized,
        note: note.trim() || undefined,
      });
      onSuccess(result.wallet.balance);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Deposit"
      description="Add funds to this customer wallet."
      dismissible={!submitting}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="deposit-form" className="btn-primary" disabled={submitting}>
            {submitting && <SpinnerIcon className="h-4 w-4" />}
            Deposit
          </button>
        </>
      }
    >
      <form id="deposit-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deposit-amount" className="field-label">
            Amount
          </label>
          <div className="relative">
            <input
              id="deposit-amount"
              data-autofocus
              value={amount}
              onChange={(event) => setAmount(cleanAmountInput(event.target.value))}
              onBlur={() => {
                const normalized = amountForApi(amount);
                if (normalized) setAmount(normalized);
              }}
              inputMode="decimal"
              placeholder="0.00"
              disabled={submitting}
              className="field-input pr-14 font-mono"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              ETB
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="deposit-note" className="field-label">
            Note
          </label>
          <input
            id="deposit-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={submitting}
            placeholder="Optional"
            className="field-input"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

function WithdrawDialog({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: (balance: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizedAmount = amountForApi(amount);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!normalizedAmount) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await requestWithdrawalOtp(customerId, normalizedAmount);
      setExpiresAt(result.otp.expires_at);
      setStep(2);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (submitting) return;
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP sent to the customer.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await confirmWithdrawal(customerId, {
        amount: normalizedAmount,
        code,
        note: note.trim() || undefined,
      });
      onSuccess(result.wallet.balance);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Withdraw"
      description={step === 1 ? "Request an OTP before completing the withdrawal." : "Confirm the OTP read back by the customer."}
      dismissible={!submitting}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          {step === 1 ? (
            <button type="submit" form="withdraw-request-form" className="btn-primary" disabled={submitting}>
              {submitting && <SpinnerIcon className="h-4 w-4" />}
              Send OTP
            </button>
          ) : (
            <button type="submit" form="withdraw-confirm-form" className="btn-primary" disabled={submitting}>
              {submitting && <SpinnerIcon className="h-4 w-4" />}
              Confirm withdrawal
            </button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <form id="withdraw-request-form" onSubmit={requestOtp} className="space-y-4">
          <div>
            <label htmlFor="withdraw-amount" className="field-label">
              Amount
            </label>
            <div className="relative">
              <input
                id="withdraw-amount"
                data-autofocus
                value={amount}
                onChange={(event) => setAmount(cleanAmountInput(event.target.value))}
                onBlur={() => {
                  const normalized = amountForApi(amount);
                  if (normalized) setAmount(normalized);
                }}
                inputMode="decimal"
                placeholder="0.00"
                disabled={submitting}
                className="field-input pr-14 font-mono"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                ETB
              </span>
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
              {error}
            </p>
          )}
        </form>
      ) : (
        <form id="withdraw-confirm-form" onSubmit={confirmOtp} className="space-y-4">
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 text-[13px] text-brand-800">
            OTP sent to customer for {formatMoney(normalizedAmount)}
            {expiresAt && <span className="block text-brand-700">Expires {formatDateTime(expiresAt)}</span>}
          </div>
          <div>
            <label className="field-label">OTP code</label>
            <OtpInput
              value={code}
              onChange={(value) => {
                setCode(value);
                setError(null);
              }}
              onComplete={() => undefined}
              disabled={submitting}
              invalid={Boolean(error)}
              label="Withdrawal OTP"
            />
          </div>
          <div>
            <label htmlFor="withdraw-note" className="field-label">
              Note
            </label>
            <input
              id="withdraw-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={submitting}
              placeholder="Optional"
              className="field-input"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
              {error}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}

function ResetPinDialog({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const submittedPin = pin.trim();
    if (!/^\d{4,6}$/.test(submittedPin)) {
      setError("PIN must be 4 to 6 digits.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setPin("");
    try {
      await setCustomerPin(customerId, submittedPin);
      onSuccess();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Reset PIN"
      description="Set a new mobile app login PIN for this customer."
      dismissible={!submitting}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="reset-pin-form" className="btn-primary" disabled={submitting}>
            {submitting && <SpinnerIcon className="h-4 w-4" />}
            Save PIN
          </button>
        </>
      }
    >
      <form id="reset-pin-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-pin" className="field-label">
            New PIN
          </label>
          <input
            id="reset-pin"
            data-autofocus
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            placeholder="4-6 digits"
            disabled={submitting}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "reset-pin-error reset-pin-hint" : "reset-pin-hint"}
            className={`field-input font-mono ${
              error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12" : ""
            }`}
          />
          <p id="reset-pin-hint" className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Customer will need this PIN to log into the mobile app.
          </p>
          {error && (
            <p id="reset-pin-error" role="alert" className="mt-1.5 text-xs text-rose-600">
              {error}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

function StatusDialog({
  customer,
  mode,
  onClose,
  onSuccess,
}: {
  customer: Customer;
  mode: StatusDialogMode;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextStatus = mode === "block" ? "blocked" : "active";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await updateCustomerStatus(customer.id, {
        status: nextStatus,
        reason: reason.trim() || undefined,
      });
      onSuccess(result.customer);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "block" ? "Block customer" : "Activate customer"}
      description={
        mode === "block"
          ? "Blocked customers cannot receive deposits or complete withdrawals."
          : "Restore this customer so wallet operations can continue."
      }
      dismissible={!submitting}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="status-form" className="btn-primary" disabled={submitting}>
            {submitting && <SpinnerIcon className="h-4 w-4" />}
            {mode === "block" ? "Block customer" : "Activate customer"}
          </button>
        </>
      }
    >
      <form id="status-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="status-reason" className="field-label">
            Reason
          </label>
          <textarea
            id="status-reason"
            data-autofocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={submitting}
            rows={3}
            placeholder="Optional"
            className="field-input min-h-24 resize-y"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

export function CustomerDetailView() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ?? "";

  const [tab, setTab] = useState<Tab>("overview");
  const [verifying, setVerifying] = useState(false);
  const [moneyDialog, setMoneyDialog] = useState<MoneyDialog | null>(null);
  const [statusDialog, setStatusDialog] = useState<StatusDialogMode | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [transactionPage, setTransactionPage] = useState(1);

  const customerSource = useCallback(
    (signal: AbortSignal) => getCustomer(customerId, signal),
    [customerId],
  );
  const { data, error, loading, reload } = useApiResource(customerSource);

  const transactionSource = useCallback(
    (signal: AbortSignal) =>
      listCustomerTransactions(
        customerId,
        { page: transactionPage, limit: TRANSACTION_PAGE_SIZE },
        signal,
      ),
    [customerId, transactionPage],
  );
  const {
    data: transactionData,
    error: transactionError,
    loading: transactionsLoading,
    reload: reloadTransactions,
  } = useApiResource(transactionSource);

  const customer = data?.customer;
  const wallet = data?.wallet;
  const transactions = transactionData?.data ?? [];
  const transactionPagination = transactionData?.pagination;

  const transactionRange = useMemo(() => {
    if (!transactionPagination || transactionPagination.total === 0) return null;
    const start = (transactionPagination.page - 1) * transactionPagination.limit + 1;
    const end = Math.min(start + transactions.length - 1, transactionPagination.total);
    return { start, end, total: transactionPagination.total };
  }, [transactionPagination, transactions.length]);

  function handleActivated(updated: Customer, event: "registered" | "activated") {
    if (event !== "activated") return;
    reload();
    setBanner(`${updated.full_name} is verified and active.`);
  }

  function handleMoneySuccess(kind: "deposit" | "withdrawal", balance: string) {
    setMoneyDialog(null);
    reload();
    reloadTransactions();
    setTransactionPage(1);
    setBanner(
      `${kind === "deposit" ? "Deposit" : "Withdrawal"} completed. New balance: ${formatMoney(balance)}.`,
    );
  }

  function handlePinReset() {
    setMoneyDialog(null);
    setBanner("Customer PIN has been reset. Share it with the customer securely.");
  }

  function handleStatusSuccess(updated: Customer) {
    setStatusDialog(null);
    reload();
    setBanner(`${updated.full_name} is now ${updated.status}.`);
  }

  if (error) {
    const notFound = isApiError(error) && error.status === 404;
    return (
      <>
        <div className="pb-6">
          <BackLink />
        </div>
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-800">
            {notFound ? "Customer not found" : "Could not load this customer"}
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
            {notFound
              ? "This customer may have been removed, or the link is wrong."
              : friendlyMessage(error)}
          </p>
          {!notFound && (
            <button type="button" onClick={reload} className="btn-secondary mt-5">
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          )}
        </div>
      </>
    );
  }

  if (!customer || !wallet) {
    return (
      <>
        <div className="pb-6">
          <BackLink />
        </div>
        <div className="card p-6" aria-busy={loading}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pb-6">
        <BackLink />
      </div>

      {banner && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] leading-relaxed text-emerald-800"
        >
          <CheckCircleIcon className="mt-px h-4 w-4 shrink-0 text-emerald-500" />
          {banner}
        </div>
      )}

      {/* Profile header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-900 text-base font-semibold text-white">
              {initialsOf(customer.full_name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-navy-900">
                {customer.full_name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={customer.status} size="md" />
                <span className="font-mono text-[13px] text-slate-500">
                  {customer.phone_number}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {customer.status === "pending" && (
              <button type="button" className="btn-primary" onClick={() => setVerifying(true)}>
                Verify OTP
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => setMoneyDialog("deposit")}
              disabled={customer.status !== "active"}
            >
              <PlusIcon className="h-4 w-4" />
              Deposit
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMoneyDialog("withdraw")}
              disabled={customer.status !== "active"}
            >
              Withdraw
            </button>
            {customer.status === "active" && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMoneyDialog("reset-pin")}
              >
                Reset PIN
              </button>
            )}
            {customer.status === "active" && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStatusDialog("block")}
              >
                Block
              </button>
            )}
            {customer.status === "blocked" && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStatusDialog("activate")}
              >
                Activate
              </button>
            )}
            <button
              type="button"
              className="btn-secondary px-2.5 py-2"
              onClick={reload}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Wallet balance */}
        <div className="border-t border-line bg-slate-50/60 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                Wallet balance
              </p>
              <p className="mt-1.5 font-mono text-3xl font-semibold leading-none tracking-tight text-navy-900">
                {formatMoney(wallet.balance)}
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Updated {formatDateTime(wallet.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div role="tablist" aria-label="Customer sections" className="flex gap-1 border-b border-line">
          {TABS.map((entry) => {
            const selected = tab === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${entry.id}`}
                id={`tab-${entry.id}`}
                onClick={() => setTab(entry.id)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  selected
                    ? "border-brand-600 text-navy-900"
                    : "border-transparent text-slate-500 hover:border-line-strong hover:text-slate-800"
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <div className="pt-5">
          {tab === "overview" ? (
            <div
              role="tabpanel"
              id="panel-overview"
              aria-labelledby="tab-overview"
              className="grid gap-4 lg:grid-cols-2"
            >
              <Panel title="Identity" description="Details captured at registration.">
                <div className="divide-y divide-line">
                  <DetailRow icon={PhoneIcon} label="Phone number" value={customer.phone_number} mono />
                  <DetailRow icon={IdCardIcon} label="National ID" value={customer.national_id} mono />
                  <DetailRow
                    icon={CalendarIcon}
                    label="Registered"
                    value={formatDateTime(customer.created_at)}
                  />
                </div>
              </Panel>

              <Panel title="Account" description="Wallet and status references.">
                <div className="divide-y divide-line">
                  <DetailRow
                    icon={ShieldIcon}
                    label="Status"
                    value={
                      customer.status === "pending"
                        ? "Pending — awaiting OTP verification"
                        : customer.status === "active"
                          ? "Active — wallet in use"
                          : "Blocked — no transactions allowed"
                    }
                  />
                  <DetailRow icon={IdCardIcon} label="Customer ID" value={customer.id} mono />
                  <DetailRow icon={IdCardIcon} label="Wallet ID" value={wallet.id} mono />
                </div>
              </Panel>
            </div>
          ) : (
            <div role="tabpanel" id="panel-transactions" aria-labelledby="tab-transactions">
              <Panel title="Transactions" description="Statement of wallet movements.">
                {transactionError ? (
                  <div className="flex flex-col items-center px-6 py-14 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <AlertIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-medium text-slate-800">
                      Could not load transactions
                    </p>
                    <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
                      {friendlyMessage(transactionError)}
                    </p>
                    <button type="button" onClick={reloadTransactions} className="btn-secondary mt-5">
                      <RefreshIcon className="h-4 w-4" />
                      Try again
                    </button>
                  </div>
                ) : transactions.length === 0 && !transactionsLoading ? (
                  <div className="p-5">
                    <EmptyState
                      icon={TransactionsIcon}
                      title="No transactions to show yet"
                      body="Deposits and withdrawals for this wallet will appear here."
                    />
                  </div>
                ) : (
                  <>
                    <TransactionTable transactions={transactions} loading={transactionsLoading} />
                    {transactionPagination && transactionPagination.total > 0 && (
                      <div className="flex flex-col items-center gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:justify-between">
                        <p className="text-[13px] text-slate-500">
                          {transactionRange && (
                            <>
                              Showing{" "}
                              <span className="font-medium text-slate-700">{transactionRange.start}</span>
                              {"-"}
                              <span className="font-medium text-slate-700">{transactionRange.end}</span>{" "}
                              of{" "}
                              <span className="font-medium text-slate-700">{transactionRange.total}</span>
                            </>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-2"
                            onClick={() => setTransactionPage(Math.max(1, transactionPage - 1))}
                            disabled={transactionsLoading || transactionPagination.page <= 1}
                            aria-label="Previous transaction page"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <span className="min-w-[5.5rem] text-center text-[13px] text-slate-500">
                            Page{" "}
                            <span className="font-medium text-slate-700">
                              {transactionPagination.page}
                            </span>{" "}
                            of {Math.max(1, transactionPagination.total_pages)}
                          </span>
                          <button
                            type="button"
                            className="btn-secondary px-2.5 py-2"
                            onClick={() => setTransactionPage(transactionPage + 1)}
                            disabled={
                              transactionsLoading ||
                              transactionPagination.page >= transactionPagination.total_pages
                            }
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
            </div>
          )}
        </div>
      </div>

      {verifying && (
        <CustomerOnboardingDialog
          customer={customer}
          onClose={() => setVerifying(false)}
          onCustomerChanged={handleActivated}
        />
      )}

      {moneyDialog === "deposit" && (
        <DepositDialog
          customerId={customer.id}
          onClose={() => setMoneyDialog(null)}
          onSuccess={(balance) => handleMoneySuccess("deposit", balance)}
        />
      )}

      {moneyDialog === "withdraw" && (
        <WithdrawDialog
          customerId={customer.id}
          onClose={() => setMoneyDialog(null)}
          onSuccess={(balance) => handleMoneySuccess("withdrawal", balance)}
        />
      )}

      {moneyDialog === "reset-pin" && (
        <ResetPinDialog
          customerId={customer.id}
          onClose={() => setMoneyDialog(null)}
          onSuccess={handlePinReset}
        />
      )}

      {statusDialog && (
        <StatusDialog
          customer={customer}
          mode={statusDialog}
          onClose={() => setStatusDialog(null)}
          onSuccess={handleStatusSuccess}
        />
      )}
    </>
  );
}
