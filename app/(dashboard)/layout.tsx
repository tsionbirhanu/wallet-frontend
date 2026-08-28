import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardChrome } from "@/components/dashboard-chrome";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardChrome>{children}</DashboardChrome>
    </AuthGuard>
  );
}
