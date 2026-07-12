"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Download,
  Globe2,
  HardDrive,
  Heart,
  Images,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  X
} from "lucide-react";
import type { AdminSession } from "@/lib/auth";
import { logoutAction } from "@/app/admin/(dashboard)/actions";

type AdminStudioShellProps = {
  children: ReactNode;
  session: AdminSession;
};

const primaryNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Website", icon: Globe2 },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/galleries", label: "Galleries", icon: Images },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/drive-accounts", label: "Drive Sync", icon: HardDrive },
  { href: "/admin/media", label: "Media Library", icon: Library }
];

const activityNav = [
  { href: "/admin/favorites", label: "Selections", icon: Heart },
  { href: "/admin/downloads", label: "Downloads", icon: Download },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

const pageTitles: Array<[string, string]> = [
  ["/admin/drive-accounts", "Drive Sync"],
  ["/admin/favorites", "Selections"],
  ["/admin/downloads", "Downloads"],
  ["/admin/inquiries", "Inquiries"],
  ["/admin/galleries", "Galleries"],
  ["/admin/clients", "Clients"],
  ["/admin/events", "Events"],
  ["/admin/albums", "Albums"],
  ["/admin/media", "Media Library"],
  ["/admin/content", "Website"],
  ["/admin/settings", "Settings"],
  ["/admin", "Dashboard"]
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function NavigationGroup({ pathname, onNavigate, items }: { pathname: string; onNavigate: () => void; items: typeof primaryNav }) {
  return (
    <nav className="admin-studio-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={isActive(pathname, item.href) ? "is-active" : ""}>
            <Icon size={17} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminStudioShell({ children, session }: AdminStudioShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = pageTitles.find(([path]) => (path === "/admin" ? pathname === path : pathname.startsWith(path)))?.[1] || "Studio";
  const initials = (session.name || session.email)
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className={`admin-studio ${menuOpen ? "is-menu-open" : ""}`}>
      <button className="admin-menu-scrim" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      <aside className="admin-studio-sidebar">
        <button className="admin-sidebar-close" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}>
          <X size={19} />
        </button>
        <Link href="/admin" className="admin-studio-brand" onClick={() => setMenuOpen(false)}>
          <span>ROOH <i>N</i> RANG</span>
          <small>EDITORIAL STUDIO</small>
        </Link>

        <NavigationGroup pathname={pathname} onNavigate={() => setMenuOpen(false)} items={primaryNav} />
        <p className="admin-nav-label">Engagement</p>
        <NavigationGroup pathname={pathname} onNavigate={() => setMenuOpen(false)} items={activityNav} />

        <div className="admin-sidebar-footer">
          <div className="admin-studio-date"><strong>{String(new Date().getDate()).padStart(2, "0")}</strong><span>{new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span></div>
          <div className="admin-profile">
            <span className="admin-avatar">{initials || "RR"}</span>
            <span><strong>{session.name || "Studio Admin"}</strong><small>{session.email}</small></span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="admin-logout"><LogOut size={16} />Logout</button>
          </form>
        </div>
      </aside>

      <div className="admin-studio-workspace">
        <header className="admin-studio-header">
          <div className="admin-header-title">
            <button type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
            <div><span>ROOH N RANG</span><h1>{pageTitle}</h1></div>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin/inquiries" className="admin-icon-link" aria-label="Open inquiries"><Bell size={17} /><i /></Link>
            <details className="admin-create-menu">
              <summary><Plus size={16} />New</summary>
              <div>
                <Link href="/admin/clients/new"><Users size={16} /><span><strong>Client</strong><small>Add profile and contact</small></span><ChevronRight size={15} /></Link>
                <Link href="/admin/events/new"><Images size={16} /><span><strong>Gallery</strong><small>Create protected event</small></span><ChevronRight size={15} /></Link>
                <Link href="/admin/drive-accounts"><HardDrive size={16} /><span><strong>Drive account</strong><small>Connect media source</small></span><ChevronRight size={15} /></Link>
              </div>
            </details>
            <span className="admin-avatar admin-avatar-header">{initials || "RR"}</span>
          </div>
        </header>
        <main className="admin-studio-main">{children}</main>
      </div>
    </div>
  );
}
