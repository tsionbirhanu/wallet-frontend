"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionToken } from "@/lib/use-session";
import { BrandMark, SpinnerIcon } from "@/components/icons";

/**
 * Client-side route guard for the (dashboard) group.
 *
 * The token lives in localStorage, so the check cannot happen on the server —
 * protected children are withheld until the token is confirmed, which keeps
 * dashboard chrome from flashing for a signed-out visitor. The token is read
 * from the session store, so a logout here or in another tab (or a 401 that
 * clears the token) bounces the admin to /login immediately.
 *
 * When the session is hardened to an httpOnly cookie (see lib/auth.ts), this
 * moves to proxy.ts and this component collapses to a pass-through.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSessionToken();
  const authorized = token !== null;

  useEffect(() => {
    if (authorized) return;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [authorized, pathname, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas">
        <BrandMark className="h-10 w-10 text-navy-900" />
        <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
          <SpinnerIcon className="h-4 w-4 text-brand-600" />
          Checking your session…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
