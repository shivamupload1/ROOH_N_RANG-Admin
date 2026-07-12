import Link from "next/link";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { deleteEventAction } from "@/app/admin/(dashboard)/actions";
import { EmptyState } from "@/components/admin/empty-state";
import { prisma } from "@/lib/db";
import { galleryUrl } from "@/lib/app-urls";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    include: {
      client: true,
      driveAccount: true,
      _count: {
        select: { albums: true, mediaFiles: true, favorites: true, downloads: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Events</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Create protected galleries with PINs, publish controls, expiry options, and download permissions.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-rust"
        >
          <Plus size={17} />
          Add Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Plus} title="No events yet" description="Create an event after adding a client and Drive account." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-ivory text-ink/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Gallery</th>
                <th className="px-4 py-3 font-semibold">Media</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{event.name}</p>
                    <p className="text-xs text-ink/55">
                      {event.client.name} / {event.city || "No city"}
                    </p>
                    <p className="text-xs text-ink/45">{event.driveAccount.label}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    <Link href={galleryUrl(event.slug)} target="_blank" rel="noreferrer" className="font-semibold text-rust hover:text-ink">
                      /gallery/{event.slug}
                    </Link>
                    <p className="mt-1 text-xs">
                      {event.isPublished ? "Published" : "Draft"} / {event.downloadAllowed ? "Downloads on" : "Downloads off"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {event._count.albums} albums / {event._count.mediaFiles} files
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {event._count.favorites} favorites / {event._count.downloads} downloads
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                        title="Edit event"
                      >
                        <Edit3 size={16} />
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/albums`}
                        className="inline-flex items-center rounded-md border border-ink/10 px-3 text-xs font-semibold text-ink transition hover:border-rust hover:text-rust"
                      >
                        Albums
                      </Link>
                      <form action={deleteEventAction.bind(null, event.id)}>
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                          title="Delete event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
