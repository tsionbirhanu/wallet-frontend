import type { ReactNode } from "react";
import { BrandMark } from "@/components/icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-xl border border-line bg-white px-6 py-7 shadow-card sm:px-8 sm:py-8">
        <div className="mb-7 flex items-center gap-3">
          <BrandMark className="h-9 w-9 text-brand-600" />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-navy-900">Wallet</p>
            <p className="text-xs text-slate-500">Admin console</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
