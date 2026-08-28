"use client";

import { useSyncExternalStore } from "react";
import { getAdmin, getToken, subscribeToSession } from "./auth";
import type { Admin } from "./types";

/**
 * localStorage is an external store, so the session is read through
 * `useSyncExternalStore` rather than mirrored into component state. That keeps
 * server render and hydration consistent (both see `null`) and makes every
 * mounted component react to login/logout — including from another tab.
 */

const serverToken = () => null;
const serverAdmin = () => null;

/** The raw admin JWT, or null when signed out. */
export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribeToSession, getToken, serverToken);
}

/** The signed-in admin's profile, or null when signed out. */
export function useAdmin(): Admin | null {
  return useSyncExternalStore(subscribeToSession, getAdmin, serverAdmin);
}
