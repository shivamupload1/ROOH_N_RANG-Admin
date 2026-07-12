import type { ReactNode } from "react";
import type { AdminSession } from "@/lib/auth";
import { AdminStudioShell } from "@/components/admin/admin-studio-shell";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
  session: AdminSession;
};

export function ProtectedAdminLayout({ children, session }: ProtectedAdminLayoutProps) {
  return <AdminStudioShell session={session}>{children}</AdminStudioShell>;
}
