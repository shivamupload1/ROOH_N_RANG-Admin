import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { galleryUrl } from "@/lib/app-urls";

export default async function AdminGalleriesPage() {
  const events = await prisma.event.findMany({
    include: {
      client: true,
      _count: { select: { albums: true, mediaFiles: true, favorites: true, downloads: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Galleries</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Copy gallery links, check publish state, and track event-level activity.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ivory text-ink/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Gallery</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Content</th>
              <th className="px-4 py-3 font-semibold">Tracking</th>
              <th className="px-4 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-ink/10">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{event.name}</p>
                  <p className="text-xs text-ink/55">/gallery/{event.slug}</p>
                  <p className="text-xs text-ink/45">{event.client.name}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {event.isPublished ? "Published" : "Draft"}
                  <p className="text-xs text-ink/45">{event.expiryDate ? `Expires ${event.expiryDate.toLocaleDateString("en-IN")}` : "No expiry"}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {event._count.albums} albums / {event._count.mediaFiles} files
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {event._count.favorites} favorites / {event._count.downloads} downloads
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={galleryUrl(event.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                    title="Open gallery"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/55" colSpan={5}>
                  No event galleries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
