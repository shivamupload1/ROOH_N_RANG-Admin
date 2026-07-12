import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProtectedAdminLayout } from "@/components/admin/protected-admin-layout";
import { requireAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Dashboard"
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();

  return <ProtectedAdminLayout session={session}>{children}</ProtectedAdminLayout>;
}
