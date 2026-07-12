import Link from "next/link";
import { adminNavItems, brand } from "@/lib/content";

export function AdminSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-ink/10 bg-ink p-5 text-ivory lg:block">
      <Link href="/admin" className="block">
        <p className="text-lg font-bold tracking-[0.12em]">{brand.name}</p>
        <p className="mt-1 text-xs text-marigold">Admin Studio</p>
      </Link>
      <nav className="mt-8 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ivory/75 transition hover:bg-white/10 hover:text-ivory"
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
