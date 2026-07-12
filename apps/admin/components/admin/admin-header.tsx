import { LogOut } from "lucide-react";
import type { AdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/(dashboard)/actions";

export function AdminHeader({ session }: { session: AdminSession }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm text-ink/55">Signed in as</p>
        <h1 className="text-lg font-semibold text-ink">{session.name || session.email}</h1>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-rust hover:text-rust"
        >
          <LogOut size={17} />
          Logout
        </button>
      </form>
    </header>
  );
}
