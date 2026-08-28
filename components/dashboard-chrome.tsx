"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminInitials, clearSession } from "@/lib/auth";
import { useAdmin } from "@/lib/use-session";
import {
  BrandMark,
  CloseIcon,
  CustomersIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  TransactionsIcon,
} from "@/components/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/customers", label: "Customers", icon: CustomersIcon },
  { href: "/transactions", label: "Transactions", icon: TransactionsIcon },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const admin = useAdmin();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const pageTitle = useMemo(
    () => NAV_ITEMS.find((item) => isActive(pathname, item.href))?.label ?? "Wallet Admin",
    [pathname],
  );

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Drawer backdrop (mobile only) */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-[2px] transition-opacity lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-navy-900 transition-transform duration-200 ease-out lg:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-3 px-5">
          <Link
            href="/dashboard"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          >
            <BrandMark className="h-9 w-9 text-brand-600" />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-white">
                Wallet
              </span>
              <span className="block text-[11px] text-slate-400">Admin console</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="-mr-1 rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pt-4" aria-label="Main">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Operations
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: NavIcon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                      active
                        ? "bg-white/8 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400"
                      />
                    )}
                    <NavIcon
                      className={`h-[18px] w-[18px] transition ${
                        active ? "text-brand-300" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
              {adminInitials(admin)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-medium text-white">
                {admin?.full_name ?? "Administrator"}
              </span>
              <span className="block truncate font-mono text-[11px] text-slate-400">
                {admin?.phone_number ?? "—"}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <LogoutIcon className="h-[18px] w-[18px] text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <h2 className="text-[15px] font-semibold tracking-tight text-navy-900">{pageTitle}</h2>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-[13px] font-semibold text-white">
              {adminInitials(admin)}
            </span>
          </div>
        </header>

        <main className="px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
