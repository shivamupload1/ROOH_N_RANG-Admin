import { Camera, Plus, Trash2 } from "lucide-react";
import { createMediaFileAction, deleteMediaFileAction, importDriveFolderAction } from "@/app/admin/(dashboard)/actions";
import { SelectField } from "@/components/admin/form-controls";
import { FormField } from "@/components/admin/form-field";
import { prisma } from "@/lib/db";

export default async function AdminMediaPage() {
  const [mediaFiles, events, albums, driveAccounts] = await Promise.all([
    prisma.mediaFile.findMany({
      include: {
        event: true,
        album: true,
        driveAccount: true
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.album.findMany({ include: { event: true }, orderBy: [{ eventId: "asc" }, { sortOrder: "asc" }] }),
    prisma.driveAccount.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  const eventOptions = [{ label: "Choose event", value: "" }, ...events.map((event) => ({ label: event.name, value: event.id }))];
  const albumOptions = [
    { label: "No album", value: "" },
    ...albums.map((album) => ({ label: `${album.event.name} / ${album.name}`, value: album.id }))
  ];
  const driveOptions = [
    { label: "Choose Drive account", value: "" },
    ...driveAccounts.map((account) => ({ label: `${account.label} (${account.status})`, value: account.id }))
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2 + 3</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Media Library</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Add Drive-backed media metadata manually now, or import file metadata from a connected Drive folder.
          </p>
        </div>

        <form action={createMediaFileAction} className="grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Add media metadata</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Event" name="eventId" required options={eventOptions} />
            <SelectField label="Album" name="albumId" options={albumOptions} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Drive account" name="driveAccountId" required options={driveOptions} />
            <FormField label="Drive file ID" name="driveFileId" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="File name" name="fileName" required />
            <FormField label="MIME type" name="mimeType" defaultValue="image/jpeg" required />
            <SelectField
              label="Media type"
              name="mediaType"
              options={[
                { label: "Photo", value: "PHOTO" },
                { label: "Video", value: "VIDEO" }
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Thumbnail URL" name="thumbnailUrl" />
            <FormField label="Preview URL" name="previewUrl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-md border border-ink/10 bg-ivory px-3 py-3 text-sm font-semibold text-ink">
              <input type="checkbox" name="downloadAllowed" className="h-4 w-4 accent-rust" />
              Allow download
            </label>
            <label className="flex items-center gap-3 rounded-md border border-ink/10 bg-ivory px-3 py-3 text-sm font-semibold text-ink">
              <input type="checkbox" name="isFeatured" className="h-4 w-4 accent-rust" />
              Feature publicly
            </label>
          </div>
          <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
            <Plus size={17} />
            Add Media
          </button>
        </form>

        <form action={importDriveFolderAction} className="grid gap-4 rounded-lg border border-marigold/30 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Import from Drive folder</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Event" name="eventId" required options={eventOptions} />
            <SelectField label="Album" name="albumId" options={albumOptions} />
          </div>
          <SelectField label="Connected Drive account" name="driveAccountId" required options={driveOptions} />
          <FormField label="Drive folder ID" name="folderId" required />
          <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-rust px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
            <Camera size={17} />
            Import Metadata
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ivory text-ink/70">
            <tr>
              <th className="px-4 py-3 font-semibold">File</th>
              <th className="px-4 py-3 font-semibold">Gallery</th>
              <th className="px-4 py-3 font-semibold">Permissions</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mediaFiles.map((media) => (
              <tr key={media.id} className="border-t border-ink/10">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{media.fileName}</p>
                  <p className="text-xs text-ink/55">{media.mediaType} / {media.mimeType}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {media.event.name}
                  <p className="text-xs text-ink/45">{media.album?.name || "No album"} / {media.driveAccount.label}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {media.downloadAllowed ? "Download on" : "Download off"}
                  <p className="text-xs text-ink/45">{media.isFeatured ? "Featured" : "Private gallery"}</p>
                </td>
                <td className="px-4 py-3">
                  <form action={deleteMediaFileAction.bind(null, media.id)}>
                    <button
                      type="submit"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                      title="Delete media"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {mediaFiles.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/55" colSpan={4}>
                  No media metadata yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
