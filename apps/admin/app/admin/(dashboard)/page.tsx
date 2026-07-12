/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Cloud, Download, Heart, Images, Users } from "lucide-react";
import { prisma } from "@/lib/db";

function formatStorage(bytes: bigint | null) {
  if (!bytes || bytes <= 0n) return "0 GB";
  const gigabytes = Number(bytes) / 1024 ** 3;
  return gigabytes >= 1024 ? `${(gigabytes / 1024).toFixed(1)} TB` : `${gigabytes.toFixed(1)} GB`;
}

function eventImage(event: { mediaFiles: Array<{ thumbnailUrl: string | null; previewUrl: string | null }> }, fallback: string) {
  return event.mediaFiles[0]?.previewUrl || event.mediaFiles[0]?.thumbnailUrl || fallback;
}

export default async function AdminDashboardPage() {
  const [clients, events, mediaFiles, favorites, downloads, driveAccounts, storage, recentEvents, recentInquiries] = await Promise.all([
    prisma.client.count(),
    prisma.event.count(),
    prisma.mediaFile.count(),
    prisma.favorite.count(),
    prisma.download.count(),
    prisma.driveAccount.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.mediaFile.aggregate({ _sum: { fileSize: true } }),
    prisma.event.findMany({
      include: {
        client: true,
        mediaFiles: { select: { thumbnailUrl: true, previewUrl: true }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 1 },
        _count: { select: { mediaFiles: true, albums: true, favorites: true, downloads: true } }
      },
      orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
      take: 4
    }),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 4 })
  ]);

  const connectedDrives = driveAccounts.find((item) => item.status === "CONNECTED")?._count._all || 0;
  const totalDrives = driveAccounts.reduce((total, item) => total + item._count._all, 0);
  const drivePercent = totalDrives ? Math.round((connectedDrives / totalDrives) * 100) : 0;
  const featured = recentEvents[0];
  const fallbackImages = ["/admin/gallery-featured.jpg", "/admin/gallery-portrait.jpg", "/admin/gallery-story.jpg", "/admin/gallery-film.jpg"];

  return (
    <div className="admin-dashboard-page">
      <section className="admin-metric-grid" aria-label="Studio overview">
        <Link href="/admin/galleries" className="admin-metric-card"><span>Galleries</span><strong>{events}</strong><small>{recentEvents.filter((event) => event.isPublished).length} recently published</small></Link>
        <Link href="/admin/clients" className="admin-metric-card"><span>Clients</span><strong>{clients}</strong><small>Real database profiles</small></Link>
        <Link href="/admin/media" className="admin-metric-card"><span>Media</span><strong>{mediaFiles.toLocaleString("en-IN")}</strong><small>{formatStorage(storage._sum.fileSize)} indexed</small></Link>
        <Link href="/admin/drive-accounts" className="admin-metric-card"><span>Drive accounts</span><strong>{connectedDrives}/{totalDrives}</strong><small>{drivePercent}% connected</small></Link>
      </section>

      <section className="admin-featured-gallery">
        {/* Database media can be a Google Drive proxy URL, so this preview intentionally uses a normal image element. */}
        <img src={featured ? eventImage(featured, fallbackImages[0]) : fallbackImages[0]} alt={featured?.name || "Featured wedding gallery"} />
        <div className="admin-featured-overlay" />
        <div className="admin-featured-copy">
          <span>Featured Gallery</span>
          <h2>{featured?.name || "Your next story"}</h2>
          <p>{featured ? `${featured.client.name} · ${featured.city || "India"}` : "Create a client gallery to begin"}</p>
          <Link href={featured ? `/admin/events/${featured.id}` : "/admin/events/new"}>{featured ? "Open Gallery" : "Create Gallery"}<ArrowRight size={15} /></Link>
        </div>
        <span className={`admin-publish-badge ${featured?.isPublished ? "is-live" : ""}`}>{featured?.isPublished ? "Published" : "Draft"}</span>
      </section>

      <section className="admin-dashboard-lower">
        <article className="admin-editorial-card admin-sync-card">
          <header><div><span>Cloud library</span><h3>Drive Sync</h3></div><Link href="/admin/drive-accounts">Manage</Link></header>
          <div className="admin-sync-body">
            <div className="admin-sync-ring" style={{ "--sync": `${drivePercent}%` } as CSSProperties}><strong>{drivePercent}%</strong><small>connected</small></div>
            <dl>
              <div><dt>Connected</dt><dd>{connectedDrives}</dd></div>
              <div><dt>Needs attention</dt><dd>{Math.max(totalDrives - connectedDrives, 0)}</dd></div>
              <div><dt>Indexed media</dt><dd>{mediaFiles.toLocaleString("en-IN")}</dd></div>
            </dl>
          </div>
          <Link href="/admin/drive-accounts" className="admin-outline-action"><Cloud size={15} />Open Drive Sync</Link>
        </article>

        <article className="admin-editorial-card admin-activity-card">
          <header><div><span>Studio pulse</span><h3>Recent Activity</h3></div><Link href="/admin/inquiries">View inquiries</Link></header>
          <div className="admin-live-activity">
            {recentInquiries.length ? recentInquiries.map((inquiry) => (
              <div key={inquiry.id}><span className="admin-activity-symbol"><Users size={15} /></span><p><strong>{inquiry.name}</strong><small>{inquiry.eventType || "New inquiry"} · {inquiry.status}</small></p><time>{inquiry.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</time></div>
            )) : (
              <>
                <div><span className="admin-activity-symbol"><Heart size={15} /></span><p><strong>{favorites} client selections</strong><small>Saved across galleries</small></p><time>Live</time></div>
                <div><span className="admin-activity-symbol"><Download size={15} /></span><p><strong>{downloads} original downloads</strong><small>Permission-controlled delivery</small></p><time>Live</time></div>
              </>
            )}
          </div>
        </article>
      </section>

      <section className="admin-recent-galleries">
        <header><div><span>Latest work</span><h3>Recent Galleries</h3></div><Link href="/admin/galleries">View all</Link></header>
        <div>
          {recentEvents.length ? recentEvents.map((event, index) => (
            <Link href={`/admin/events/${event.id}`} key={event.id} className="admin-gallery-tile">
              <img src={eventImage(event, fallbackImages[index % fallbackImages.length])} alt="" />
              <span><strong>{event.name}</strong><small>{event._count.mediaFiles} photos · {event._count.albums} albums</small></span>
            </Link>
          )) : (
            <Link href="/admin/events/new" className="admin-gallery-empty"><Images size={24} /><strong>Create your first gallery</strong><small>Client, PIN, Drive folder and publish status</small></Link>
          )}
        </div>
      </section>
    </div>
  );
}
