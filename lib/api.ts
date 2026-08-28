/**
 * Typed fetch wrapper for the wallet backend.
 *
 * Every call goes through `request()`, so auth headers, JSON encoding, the
 * contract's error envelope, and network failures are handled in exactly one
 * place. Callers only ever deal with a resolved value or an `ApiError`.
 */

import { authHeader, clearSession } from "./auth";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ApiErrorBody,
  CustomerDetailResponse,
  CustomerListResponse,
  CustomerStatus,
  DashboardMetrics,
  FlatDashboardMetrics,
  MoneyMovementRequest,
  MoneyMovementResponse,
  Pagination,
  RegisterCustomerRequest,
  RegisterCustomerResponse,
  SetCustomerPinResponse,
  Transaction,
  UpdateCustomerStatusResponse,
  ValidationDetails,
  VerifyOtpResponse,
  WithdrawalOtpResponse,
} from "./types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

/** Host shown in the UI so it is obvious which backend the console is pointed at. */
export function apiHostLabel(): string {
  try {
    const url = new URL(API_BASE_URL);
    return url.port ? `${url.hostname}:${url.port}` : url.hostname;
  } catch {
    return API_BASE_URL;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

/** status 0 means the request never reached the server. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/**
 * Per-field messages from a 400 VALIDATION_ERROR, keyed by field name.
 * Returns an empty object for any other error.
 */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!isApiError(err) || err.code !== "VALIDATION_ERROR") return {};
  const details = err.details as ValidationDetails | undefined;
  const result: Record<string, string> = {};
  for (const entry of details?.fields ?? []) {
    if (entry?.field && entry.message && !result[entry.field]) {
      result[entry.field] = entry.message;
    }
  }
  return result;
}

/** True when the endpoint exists in the contract but is still a 501 stub. */
export function isNotImplemented(err: unknown): boolean {
  return isApiError(err) && (err.status === 501 || err.code === "NOT_IMPLEMENTED");
}

/** Copy suitable for showing directly to an admin. */
export function friendlyMessage(err: unknown): string {
  if (!isApiError(err)) {
    return "Something went wrong. Please try again.";
  }
  switch (err.code) {
    case "NETWORK_ERROR":
      return `Cannot reach the API at ${API_BASE_URL}. Check that the backend is running, then try again.`;
    case "TIMEOUT":
      return "The server took too long to respond. Please try again.";
    case "INVALID_CREDENTIALS":
      return "Incorrect email or password.";
    case "ADMIN_BLOCKED":
      return "This admin account has been blocked. Contact a system administrator.";
    case "UNAUTHENTICATED":
      return "Your session has expired. Please sign in again.";
    case "FORBIDDEN":
      return "You do not have permission to do that.";
    case "VALIDATION_ERROR": {
      // The backend sends per-field messages; surface them instead of the
      // generic "Request validation failed".
      const fields = fieldErrors(err);
      const messages = Object.values(fields);
      return messages.length > 0
        ? messages.join(" ")
        : err.message || "Please check the form and try again.";
    }
    case "PHONE_NUMBER_ALREADY_EXISTS":
      return "That phone number is already registered to another customer.";
    case "NATIONAL_ID_ALREADY_EXISTS":
      return "That national ID is already registered to another customer.";
    case "OTP_RATE_LIMITED":
      return "Too many codes have been requested for this customer. Wait a few minutes and try again.";
    case "OTP_INVALID":
      return "That code is not correct, or it has expired. Ask the customer to read it back again.";
    case "OTP_EXPIRED":
      return "That code has expired. A new one needs to be issued.";
    case "CUSTOMER_ALREADY_VERIFIED":
      return "This customer has already been verified.";
    case "CUSTOMER_NOT_FOUND":
      return "That customer no longer exists.";
    case "INVALID_STATUS_TRANSITION":
      return "That status change is not allowed from the customer's current status.";
    case "INVALID_AMOUNT":
      return "Enter a valid amount greater than zero.";
    case "INVALID_PIN":
      return "Enter a 4-6 digit numeric PIN.";
    case "INSUFFICIENT_BALANCE":
      return "This wallet does not have enough balance for that withdrawal.";
    case "CUSTOMER_NOT_ACTIVE":
      return "This customer must be active before money can move.";
    case "NOT_IMPLEMENTED":
      return "This part of the API is not built yet.";
    case "NOT_FOUND":
      return "The API does not recognise that endpoint. Check that the backend is up to date.";
    case "INTERNAL_SERVER_ERROR":
      return "The server hit an unexpected error. Please try again shortly.";
    default:
      return err.message || "Something went wrong. Please try again.";
  }
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  /** Serialized as a JSON body. Omit for GET. */
  body?: unknown;
  /** Appended as a query string; null/undefined entries are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Attach the stored admin JWT. Default true; set false for /admin/login. */
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function combineSignals(
  timeoutMs: number,
  external?: AbortSignal,
): AbortSignal | undefined {
  const timeout =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  if (!timeout) return external;
  if (!external) return timeout;
  return "any" in AbortSignal
    ? AbortSignal.any([external, timeout])
    : external;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    auth = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, authHeader());

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combineSignals(timeoutMs, signal),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(0, "TIMEOUT", "The request timed out.");
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "ABORTED", "The request was cancelled.");
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Could not reach ${API_BASE_URL}.`,
    );
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const raw = await response.text();
  let parsed: unknown = undefined;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    // Contract shape: { error: { code, message, details? } }
    const envelope = parsed as Partial<ApiErrorBody> | undefined;
    const code = envelope?.error?.code ?? `HTTP_${response.status}`;
    const message =
      envelope?.error?.message ??
      (raw && raw.length < 200 ? raw : response.statusText) ??
      "Request failed";

    // An expired/rejected token is dead weight — drop it so the guard can
    // bounce the admin to /login instead of looping on 401s.
    if (response.status === 401 && auth) {
      clearSession();
    }

    throw new ApiError(response.status, code, message, envelope?.error?.details);
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  del: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/* ---------------------------------------------------------------------------
 * Endpoint helpers (per API-CONTRACT.md). Only the ones the shell needs are
 * wired up today; the rest are here so pages don't hand-roll paths later.
 * ------------------------------------------------------------------------- */

export function adminLogin(credentials: AdminLoginRequest, signal?: AbortSignal) {
  return api.post<AdminLoginResponse>("/admin/login", credentials, {
    auth: false,
    signal,
  });
}

export function getDashboard(signal?: AbortSignal) {
  return api.get<DashboardMetrics | FlatDashboardMetrics>("/admin/dashboard", { signal });
}

export function listCustomers(
  query?: { page?: number; limit?: number; status?: CustomerStatus | ""; search?: string },
  signal?: AbortSignal,
) {
  return api.get<CustomerListResponse>("/customers", { query, signal });
}

export function getCustomer(customerId: string, signal?: AbortSignal) {
  return api.get<CustomerDetailResponse>(`/customers/${encodeURIComponent(customerId)}`, {
    signal,
  });
}

/**
 * Registers a customer and issues a registration OTP by SMS. Returns 201 with
 * the pending customer, its empty wallet, and when the code expires — never
 * the code itself, which the customer reads back to the admin.
 */
export function registerCustomer(body: RegisterCustomerRequest, signal?: AbortSignal) {
  return api.post<RegisterCustomerResponse>("/customers", body, { signal });
}

/** Verifies the registration OTP and flips the customer to active. */
export function verifyRegistrationOtp(customerId: string, code: string, signal?: AbortSignal) {
  return api.post<VerifyOtpResponse>(
    `/customers/${encodeURIComponent(customerId)}/verify-otp`,
    { code },
    { signal },
  );
}

export function updateCustomerStatus(
  customerId: string,
  body: { status: Exclude<CustomerStatus, "pending">; reason?: string },
  signal?: AbortSignal,
) {
  return api.patch<UpdateCustomerStatusResponse>(
    `/customers/${encodeURIComponent(customerId)}/status`,
    body,
    { signal },
  );
}

export function setCustomerPin(customerId: string, pin: string, signal?: AbortSignal) {
  return api.post<SetCustomerPinResponse>(
    `/customers/${encodeURIComponent(customerId)}/set-pin`,
    { pin },
    { signal },
  );
}

export function listCustomerTransactions(
  customerId: string,
  query?: { page?: number; limit?: number },
  signal?: AbortSignal,
) {
  return api.get<{ data: Transaction[]; pagination: Pagination }>(
    `/customers/${encodeURIComponent(customerId)}/transactions`,
    { query, signal },
  );
}

export function depositToCustomer(
  customerId: string,
  body: MoneyMovementRequest,
  signal?: AbortSignal,
) {
  return api.post<MoneyMovementResponse>(
    `/customers/${encodeURIComponent(customerId)}/deposit`,
    body,
    { signal },
  );
}

export function requestWithdrawalOtp(
  customerId: string,
  amount: string,
  signal?: AbortSignal,
) {
  return api.post<WithdrawalOtpResponse>(
    `/customers/${encodeURIComponent(customerId)}/withdraw/request-otp`,
    { amount },
    { signal },
  );
}

export function confirmWithdrawal(
  customerId: string,
  body: MoneyMovementRequest & { code: string },
  signal?: AbortSignal,
) {
  return api.post<MoneyMovementResponse>(
    `/customers/${encodeURIComponent(customerId)}/withdraw/confirm`,
    body,
    { signal },
  );
}
