import type { ComponentType, ReactNode, SVGProps } from "react";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-7">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-navy-900">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

/**
 * Metric tile. `value` is intentionally a string so money can stay in the
 * decimal-string form the API contract uses.
 *
 * `loading` shows a skeleton; `unavailable` is for endpoints that exist in the
 * contract but are still stubs — the tile keeps its place in the grid so the
 * layout is ready to receive the real number.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: TileIcon,
  loading = false,
  unavailable = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconType;
  loading?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            unavailable ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-600"
          }`}
        >
          <TileIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-100" />
      ) : (
        <p
          className={`mt-3 font-mono text-[22px] font-semibold leading-none tracking-tight tabular-nums ${
            unavailable ? "text-slate-300" : "text-navy-900"
          }`}
        >
          {unavailable ? "—" : value}
        </p>
      )}

      {unavailable ? (
        <p className="mt-2.5">
          <span className="inline-flex items-center rounded-full border border-line bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-slate-400">
            No data
          </span>
        </p>
      ) : (
        hint && !loading && <p className="mt-2.5 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-navy-900">{title}</h3>
        {description && <p className="mt-1 text-[13px] text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon: EmptyIcon,
  title,
  body,
}: {
  icon: IconType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <EmptyIcon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

/** Small status chip. Colors map to the contract's status enums. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warn";
}) {
  const tones = {
    neutral: "border-line bg-slate-50 text-slate-600",
    brand: "border-brand-200 bg-brand-50 text-brand-700",
    warn: "border-gold-300/70 bg-gold-300/15 text-gold-600",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
