import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.75" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.75" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.75" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.75" />
    </Icon>
  );
}

export function CustomersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8" r="3.25" />
      <path d="M3.5 19.5c0-2.9 2.7-5 6-5s6 2.1 6 5" />
      <path d="M16.5 5.6a3.2 3.2 0 0 1 0 6.1" />
      <path d="M18.2 14.9c1.5.7 2.3 2 2.3 3.6" />
    </Icon>
  );
}

export function TransactionsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h13" />
      <path d="m13.5 4.5 3.5 3.5-3.5 3.5" />
      <path d="M20 16H7" />
      <path d="m10.5 12.5-3.5 3.5 3.5 3.5" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5H18a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3.5" />
      <path d="M10 8.5 6.5 12 10 15.5" />
      <path d="M6.5 12H15" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </Icon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.4 4.1" />
      <path d="M6.3 7.9A16.8 16.8 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.35 3.8-.9" />
      <path d="M10.1 10.1a2.75 2.75 0 0 0 3.8 3.8" />
      <path d="m4 4 16 16" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7.75v5" />
      <path d="M12 16.1h.01" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2 5 6v5.4c0 4.2 2.9 7.6 7 9.4 4.1-1.8 7-5.2 7-9.4V6l-7-2.8Z" />
      <path d="m9.2 12.1 2 2 3.6-3.9" />
    </Icon>
  );
}

export function LedgerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.75 8h6.5" />
      <path d="M8.75 12h6.5" />
      <path d="M8.75 16h3.5" />
    </Icon>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 3 5.5 13.2h5.2L10.5 21 18.5 10.6h-5.3L13 3Z" />
    </Icon>
  );
}

export function SpinnerIcon({ className = "", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Brand mark: a wallet silhouette with a coin slot, drawn as a filled glyph. */
export function BrandMark({ className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M8.5 11.75A2.25 2.25 0 0 1 10.75 9.5h9.1a2.25 2.25 0 0 1 2.25 2.25v1.1h-2.05a3.15 3.15 0 0 0 0 6.3H22.1v1.1a2.25 2.25 0 0 1-2.25 2.25h-9.1a2.25 2.25 0 0 1-2.25-2.25v-8.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M20.05 14.35h3.2a.7.7 0 0 1 .7.7v2.5a.7.7 0 0 1-.7.7h-3.2a1.95 1.95 0 0 1 0-3.9Z"
        fill="white"
        fillOpacity="0.6"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m15.6 15.6 4.4 4.4" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 6.5 9 12l5.5 5.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 6.5 15 12l-5.5 5.5" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.5 9.5 5.5 5 5.5-5" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5.5" />
      <path d="M11 5.5 4.5 12l6.5 6.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5.5 12.5 4.2 4.2L18.5 7.9" />
    </Icon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.4 12.2 2.5 2.5 4.7-5.1" />
    </Icon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11.5a8 8 0 1 0-.7 4.5" />
      <path d="M20 5.5V12h-6.5" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.6 4.5h-.8A2.3 2.3 0 0 0 4.5 6.9c0 6.9 5.6 12.5 12.5 12.5a2.3 2.3 0 0 0 2.3-2.3v-.8a1.2 1.2 0 0 0-.9-1.2l-3-.8a1.2 1.2 0 0 0-1.2.4l-.8 1a9.7 9.7 0 0 1-5-5l1-.8a1.2 1.2 0 0 0 .4-1.2l-.8-3a1.2 1.2 0 0 0-1.2-.9Z" />
    </Icon>
  );
}

export function IdCardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <circle cx="9" cy="11" r="1.9" />
      <path d="M6 15.9c.5-1.3 1.6-2 3-2s2.5.7 3 2" />
      <path d="M14.75 10.5h3.75" />
      <path d="M14.75 13.75h3.75" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.75" y="5.5" width="16.5" height="14" rx="2" />
      <path d="M3.75 10h16.5" />
      <path d="M8.5 3.5v3.5" />
      <path d="M15.5 3.5v3.5" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7.4V12l3 1.9" />
    </Icon>
  );
}

export function UserPlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="8" r="3.25" />
      <path d="M4 19.5c0-2.9 2.7-5 6-5 1.1 0 2.2.24 3.1.68" />
      <path d="M17.5 14v6" />
      <path d="M14.5 17h6" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8.25A2.25 2.25 0 0 1 6.25 6h11.5A2.25 2.25 0 0 1 20 8.25v8.5A2.25 2.25 0 0 1 17.75 19H6.25A2.25 2.25 0 0 1 4 16.75v-8.5Z" />
      <path d="M20 10.75h-3.1a1.75 1.75 0 0 0 0 3.5H20" />
    </Icon>
  );
}
