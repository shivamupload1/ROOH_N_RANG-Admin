import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { updateAlbumAction } from "@/app/admin/(dashboard)/actions";
import { AlbumFormFields } from "@/components/admin/album-form-fields";
import { prisma } from "@/lib/db";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [album, events] = await Promise.all([
    prisma.album.findUnique({ where: { id } }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  if (!album) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/albums" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-rust">
        <ArrowLeft size={16} />
        Albums
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Edit album</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{album.name}</h1>
      </div>

      <form action={updateAlbumAction.bind(null, album.id)} className="mt-6 grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
        <AlbumFormFields events={events} album={album} />
        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
          <Save size={17} />
          Update Album
        </button>
      </form>
    </div>
  );
}
