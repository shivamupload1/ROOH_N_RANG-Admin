import Link from "next/link";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { createAlbumAction, deleteAlbumAction } from "@/app/admin/(dashboard)/actions";
import { AlbumFormFields } from "@/components/admin/album-form-fields";
import { EmptyState } from "@/components/admin/empty-state";
import { prisma } from "@/lib/db";

export default async function AdminAlbumsPage() {
  const [albums, events] = await Promise.all([
    prisma.album.findMany({
      include: {
        event: {
          include: { client: true }
        },
        _count: {
          select: { mediaFiles: true }
        }
      },
      orderBy: [{ eventId: "asc" }, { sortOrder: "asc" }]
    }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Albums</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Add ceremony albums such as Haldi, Mehendi, Wedding, Reception, Videos, and custom sets.
        </p>

        <form action={createAlbumAction} className="mt-6 grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
          <AlbumFormFields events={events} />
          <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
            <Plus size={17} />
            Add Album
          </button>
        </form>
      </section>

      <section>
        {albums.length === 0 ? (
          <EmptyState icon={Plus} title="No albums yet" description="Create an event first, then add albums." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-ink/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Album</th>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold">Files</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {albums.map((album) => (
                  <tr key={album.id} className="border-t border-ink/10">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{album.name}</p>
                      <p className="text-xs text-ink/55">{album.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {album.event.name}
                      <p className="text-xs text-ink/45">{album.event.client.name}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{album._count.mediaFiles}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/albums/${album.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                          title="Edit album"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <form action={deleteAlbumAction.bind(null, album.id)}>
                          <button
                            type="submit"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                            title="Delete album"
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
      </section>
    </div>
  );
}
