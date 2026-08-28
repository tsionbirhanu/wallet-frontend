import type { CustomerStatus } from "@/lib/types";

const STATUS_STYLES: Record<CustomerStatus, { label: string; chip: string; dot: string }> = {
  pending: {
    label: "Pending",
    chip: "border-gold-300/70 bg-gold-300/15 text-gold-600",
    dot: "bg-gold-400",
  },
  active: {
    label: "Active",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  blocked: {
    label: "Blocked",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
};

/** Customer status chip — the three states in the contract's status enum. */
export function StatusBadge({
  status,
  size = "sm",
}: {
  status: CustomerStatus;
  size?: "sm" | "md";
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${style.chip} ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
