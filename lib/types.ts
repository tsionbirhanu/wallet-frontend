/**
 * Types mirroring API-CONTRACT.md.
 *
 * Money is always a decimal *string* (e.g. "10000.00") — never parse it into a
 * JS number for storage or arithmetic; format it for display only.
 */

export type CustomerStatus = "pending" | "active" | "blocked";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL";
export type TransactionStatus = "pending" | "success" | "failed";

export interface Admin {
  id: string;
  email?: string;
  phone_number?: string;
  full_name?: string;
  role?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  national_id: string;
  status: CustomerStatus;
  created_at: string;
}

export interface Wallet {
  id: string;
  customer_id: string;
  balance: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  transaction_ref: string;
  customer_id: string;
  type: TransactionType;
  amount: string;
  previous_balance: string;
  new_balance: string;
  status: TransactionStatus;
  created_by_admin_id: string | null;
  otp_verified: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  customer_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/** Wallet summary embedded in customer list/detail responses. */
export interface WalletSummary {
  id: string;
  balance: string;
  updated_at: string;
}

/** GET /customers returns each customer with its wallet attached. */
export interface CustomerWithWallet extends Customer {
  wallet: WalletSummary;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** POST /admin/login — note the contract keys on phone_number, not email. */
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  token_type: "Bearer";
  scope: "admin";
  admin: Admin;
}

/** GET /admin/dashboard */
export interface DashboardMetrics {
  customers: {
    total: number;
    pending: number;
    active: number;
    blocked: number;
  };
  wallets: {
    total_balance: string;
  };
  transactions: {
    total_count: number;
    deposit_count: number;
    withdrawal_count: number;
    total_deposited: string;
    total_withdrawn: string;
    recent: Transaction[];
  };
}

export interface FlatDashboardMetrics {
  total_customers: number;
  active_customers: number;
  total_deposits: string;
  total_withdrawals: string;
  total_balance: string;
  last_transactions: Transaction[];
}

/* --------------------------------------------------------------------------
 * Customer registration + OTP
 * ------------------------------------------------------------------------ */

/**
 * POST /customers.
 *
 * The contract also lists a required `password`, but the running backend
 * validates only these three fields and never stores one, so it is omitted.
 */
export interface RegisterCustomerRequest {
  full_name: string;
  phone_number: string;
  national_id: string;
  pin?: string;
}

/** 201 response. The OTP code itself is never returned — it is sent by SMS. */
export interface RegisterCustomerResponse {
  customer: Customer;
  wallet: Wallet;
  otp: {
    purpose: "REGISTRATION";
    expires_at: string;
  };
}

/** POST /customers/:id/verify-otp */
export interface VerifyOtpResponse {
  customer: Customer;
}

/** GET /customers/:id */
export interface CustomerDetailResponse {
  customer: Customer;
  wallet: Wallet;
}

/** GET /customers */
export interface CustomerListResponse {
  data: CustomerWithWallet[];
  pagination: Pagination;
}

/** PATCH /customers/:id/status */
export interface UpdateCustomerStatusResponse {
  customer: Customer;
}

export interface SetCustomerPinResponse {
  customer: Customer;
}

export interface MoneyMovementRequest {
  amount: string;
  note?: string;
}

export interface MoneyMovementResponse {
  transaction: Transaction;
  wallet: Wallet;
}

export interface WithdrawalOtpResponse {
  otp: {
    purpose: "WITHDRAWAL";
    expires_at: string;
  };
}

/** Error envelope used by every non-2xx response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Shape the backend uses for 400 VALIDATION_ERROR details. */
export interface ValidationDetails {
  fields?: Array<{ field: string; message: string }>;
}
