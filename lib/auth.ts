/**
 * Session storage for the admin console.
 *
 * TODO(security, before production): the JWT currently lives in localStorage,
 * which is readable by any script on the origin (XSS = token theft) and cannot
 * be rotated server-side. Harden by proxying auth through Next route handlers
 * (`app/api/auth/login|logout/route.ts`) that set an httpOnly + Secure +
 * SameSite=Lax cookie, then move the route guard into `proxy.ts` (Next 16's
 * renamed middleware) so protected pages never render for an anonymous user.
 * Everything outside this module goes through the helpers below, so that swap
 * should not touch page code.
 */

import type { Admin } from "./types";

const TOKEN_KEY = "wallet_admin.token";
const ADMIN_KEY = "wallet_admin.admin";

/** Fired on login/logout so mounted components can react to session changes. */
export const SESSION_EVENT = "wallet-admin:session";

const isBrowser = () => typeof window !== "undefined";

function emitSessionChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private-mode / blocked storage: treat as signed out rather than crashing.
    return null;
  }
}

/**
 * Memoized on the raw stored string so repeated calls return a stable object
 * reference. `useSyncExternalStore` re-renders on every snapshot identity
 * change, so parsing fresh each time would loop forever.
 */
let cachedAdminRaw: string | null = null;
let cachedAdmin: Admin | null = null;

export function getAdmin(): Admin | null {
  if (!isBrowser()) return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ADMIN_KEY);
  } catch {
    return null;
  }
  if (raw !== cachedAdminRaw) {
    cachedAdminRaw = raw;
    try {
      cachedAdmin = raw ? (JSON.parse(raw) as Admin) : null;
    } catch {
      cachedAdmin = null;
    }
  }
  return cachedAdmin;
}

/** Subscribe to session changes in this tab and in other tabs. */
export function subscribeToSession(onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setSession(token: string, admin: Admin): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  } catch {
    // Ignore: the request that follows will 401 and bounce the user to /login.
  }
  emitSessionChange();
}

export function clearSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_KEY);
  } catch {
    // no-op
  }
  emitSessionChange();
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/** Header map to spread into a fetch init; empty when signed out. */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Initials for the avatar chip, e.g. "Abebe Kebede" -> "AK". */
export function adminInitials(admin: Admin | null): string {
  const name = admin?.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "AD";
  }
  const email = admin?.email?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  const digits = admin?.phone_number?.replace(/\D/g, "") ?? "";
  return digits.slice(-2) || "AD";
}
