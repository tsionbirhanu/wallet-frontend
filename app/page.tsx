import { redirect } from "next/navigation";

/**
 * The console has no public landing page. Send everyone to /login; the login
 * page forwards already-authenticated admins on to /dashboard.
 */
export default function RootPage() {
  redirect("/login");
}
