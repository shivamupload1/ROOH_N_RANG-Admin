import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderPlus, RefreshCw, Save } from "lucide-react";
import {
  createEventDriveFoldersAction,
  syncEventDriveGalleryAction,
  updateEventAction,
  updateEventDriveFolderAction
} from "@/app/admin/(dashboard)/actions";
import { EventFormFields } from "@/components/admin/event-form-fields";
import { FormField } from "@/components/admin/form-field";
import { prisma } from "@/lib/db";
import { listFiles } from "@/lib/google-drive";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const driveMessages: Record<string, string> = {
  "folder-saved": "Event folder ID saved. You can preview and sync this Google Drive folder now.",
  "folder-created": "Drive folder created for this event. Add subfolders in Drive, then run sync.",
  "sync-complete": "Albums and photos synced from Google Drive."
};

const driveErrors: Record<string, string> = {
  "missing-folder": "Save or create the event folder first, then run sync.",
  "sync-failed": "Google Drive sync could not finish. Check folder access, then reconnect Google if needed."
};

export default async function EditEventPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ drive?: string; driveError?: string }>;
}) {
  const { id } = await params;
  const { drive, driveError } = await searchParams;
  const [event, clients, driveAccounts] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        driveAccount: true,
        albums: {
          include: {
            _count: {
              select: { mediaFiles: true }
            }
          },
          orderBy: { sortOrder: "asc" }
        }
      }
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.driveAccount.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  if (!event) {
    notFound();
  }

  let driveItems: Array<{ id?: string | null; name?: string | null; mimeType?: string | null }> = [];
  let folderPreviewError = "";

  if (event.driveFolderId && event.driveAccount.status === "CONNECTED") {
    try {
      driveItems = await listFiles(event.driveAccountId, event.driveFolderId);
    } catch (error) {
      folderPreviewError = error instanceof Error ? error.message : "Could not load this Drive folder preview.";
    }
  }

  const childFolders = driveItems.filter((item) => item.mimeType === FOLDER_MIME);
  const rootFiles = driveItems.filter((item) => item.mimeType !== FOLDER_MIME);
  const statusMessage = drive ? driveMessages[drive] : "";
  const errorMessage = driveError ? driveErrors[driveError] : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="max-w-4xl">
        <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-rust">
          <ArrowLeft size={16} />
          Events
        </Link>
        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Edit event</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{event.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Update the gallery settings here, then connect one Drive folder to make the event albums and photos show automatically.
          </p>
        </div>

        {statusMessage ? (
          <p className="mt-5 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-5 rounded-md bg-rust/10 px-4 py-3 text-sm font-medium text-rust">{errorMessage}</p>
        ) : null}

        <form action={updateEventAction.bind(null, event.id)} className="mt-6 grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
          <EventFormFields clients={clients} driveAccounts={driveAccounts} event={event} />
          <p className="rounded-md bg-ivory px-3 py-2 text-xs leading-5 text-ink/55">
            For security, enter the 4 digit gallery PIN again whenever you save event settings.
          </p>
          <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
            <Save size={17} />
            Update Event
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <div className="rounded-lg border border-marigold/30 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Gallery Drive folder</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Paste the event folder ID from Google Drive or create the event folder here. All subfolders inside this folder become albums when you sync.
          </p>

          <form action={updateEventDriveFolderAction.bind(null, event.id)} className="mt-5 grid gap-4">
            <FormField
              label="Event folder ID"
              name="driveFolderId"
              defaultValue={event.driveFolderId || ""}
              placeholder="Paste the Google Drive folder ID"
            />
            <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
              <Save size={17} />
              Save Folder ID
            </button>
          </form>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <form action={createEventDriveFoldersAction.bind(null, event.id)}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-rust bg-rust px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink"
              >
                <FolderPlus size={17} />
                Create Event Folder in Drive
              </button>
            </form>
            <form action={syncEventDriveGalleryAction.bind(null, event.id)}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-rust hover:text-rust"
              >
                <RefreshCw size={17} />
                Sync Albums & Photos
              </button>
            </form>
          </div>

          <dl className="mt-5 grid gap-4 text-sm text-ink/70 sm:grid-cols-2">
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Connected Drive</dt>
              <dd className="mt-1 font-semibold text-ink">{event.driveAccount.label}</dd>
            </div>
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Drive status</dt>
              <dd className="mt-1 font-semibold text-ink">{event.driveAccount.status}</dd>
            </div>
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Mapped albums</dt>
              <dd className="mt-1 font-semibold text-ink">{event.albums.filter((album) => album.driveFolderId).length}</dd>
            </div>
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Imported files</dt>
              <dd className="mt-1 font-semibold text-ink">{event.albums.reduce((count, album) => count + album._count.mediaFiles, 0)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Folder preview</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            This shows the current event folder. Add or rename subfolders in Google Drive, then run sync to update the client gallery.
          </p>

          {!event.driveFolderId ? (
            <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Save or create an event folder first to preview its contents.</p>
          ) : event.driveAccount.status !== "CONNECTED" ? (
            <p className="mt-4 rounded-md bg-rust/10 px-4 py-3 text-sm font-medium text-rust">
              This Drive account is not connected right now. Reconnect Google before previewing or syncing.
            </p>
          ) : folderPreviewError ? (
            <p className="mt-4 rounded-md bg-rust/10 px-4 py-3 text-sm font-medium text-rust">{folderPreviewError}</p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-ink/10">
                <div className="border-b border-ink/10 bg-ivory px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Subfolders</h3>
                </div>
                {childFolders.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-ink/55">No subfolders found yet.</p>
                ) : (
                  <ul className="divide-y divide-ink/10 text-sm">
                    {childFolders.map((folder) => {
                      const mappedAlbum = event.albums.find((album) => album.driveFolderId === folder.id);

                      return (
                        <li key={folder.id || folder.name} className="px-4 py-3">
                          <p className="font-semibold text-ink">{folder.name || "Untitled folder"}</p>
                          <p className="mt-1 text-xs text-ink/55">
                            {mappedAlbum ? `${mappedAlbum.name} / ${mappedAlbum._count.mediaFiles} files imported` : "Ready to sync as album"}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-ink/10">
                <div className="border-b border-ink/10 bg-ivory px-4 py-3">
                  <h3 className="text-sm font-semibold text-ink">Files in root folder</h3>
                </div>
                {rootFiles.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-ink/55">No root-level files found. Photos inside subfolders will still sync to albums.</p>
                ) : (
                  <ul className="divide-y divide-ink/10 text-sm">
                    {rootFiles.slice(0, 12).map((file) => (
                      <li key={file.id || file.name} className="px-4 py-3">
                        <p className="font-semibold text-ink">{file.name || "Untitled file"}</p>
                        <p className="mt-1 text-xs text-ink/55">{file.mimeType || "Unknown type"}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
