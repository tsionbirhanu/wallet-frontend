import type { ReactNode } from "react";
import { BoltIcon, BrandMark, LedgerIcon, ShieldIcon } from "@/components/icons";

const highlights = [
  {
    icon: ShieldIcon,
    title: "Admin-scoped access",
    body: "Every session is bound to an admin JWT and expires on sign-out.",
  },
  {
    icon: LedgerIcon,
    title: "A complete ledger",
    body: "Balances before and after, on every deposit and withdrawal.",
  },
  {
    icon: BoltIcon,
    title: "OTP-verified movements",
    body: "Withdrawals are confirmed with a one-time code before they settle.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Brand panel — desktop */}
      <aside className="relative hidden overflow-hidden bg-navy-900 px-12 py-14 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between xl:w-[42%]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-navy-600/40 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <BrandMark className="h-10 w-10 text-brand-500" />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">Wallet</p>
            <p className="text-xs text-slate-400">Admin console</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[2.1rem] font-semibold leading-[1.15] tracking-tight">
            Run customer wallets with a clear view of every birr.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
            Register customers, move funds, and reconcile the ledger from one
            place.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: HighlightIcon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 ring-1 ring-inset ring-white/10">
                  <HighlightIcon className="h-[18px] w-[18px] text-brand-300" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-400">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Internal system · Authorized administrators only
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 flex-col bg-white">
        {/* Brand bar — mobile */}
        <div className="flex items-center gap-3 bg-navy-900 px-6 py-4 lg:hidden">
          <BrandMark className="h-8 w-8 text-brand-500" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Wallet</p>
            <p className="text-[11px] text-slate-400">Admin console</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <footer className="px-6 pb-8 text-center text-xs text-slate-400 sm:px-10">
          Wallet Admin · MVP
        </footer>
      </main>
    </div>
  );
}
