import type { Metadata } from "next";
import { CustomerDetailView } from "@/components/customer-detail-view";

export const metadata: Metadata = {
  title: "Customer",
};

/**
 * The profile is fetched client-side because the admin token lives in
 * localStorage, so the id comes from useParams rather than server params.
 */
export default function CustomerDetailPage() {
  return <CustomerDetailView />;
}
