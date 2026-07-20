import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderPlus, Link as LinkIcon, RefreshCw, Save } from "lucide-react";
import {
  createClientGalleryFolderAction,
  createClientRootFolderAction,
  syncClientGalleryFromDriveAction,
  updateClientAction,
  upsertClientDriveAccountAction,
  upsertClientGalleryAction
} from "@/app/admin/(dashboard)/actions";
import { CheckboxField, SelectField, TextareaField } from "@/components/admin/form-controls";
import { CoverPhotoEditor } from "@/components/admin/cover-photo-editor";
import { FormField } from "@/components/admin/form-field";
import { prisma } from "@/lib/db";
import { eventCoverKey, parseEventCover } from "@/lib/event-cover";
import { listFiles } from "@/lib/google-drive";
import { getGalleryDefaults } from "@/lib/site-content";
import { buildGallerySharePath, buildGalleryShareUrl, getGalleryShareCode } from "@/lib/gallery-share";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const setupMessages: Record<string, string> = {
  "client-created": "Client saved. Ab isi page se Drive aur gallery setup complete kar sakte ho.",
  "client-saved": "Client details updated.",
  "drive-saved": "Google Drive setup saved.",
  "folder-created": "Client folder create ho gaya aur root folder ID update ho gayi.",
  "gallery-saved": "Gallery setup saved.",
  "gallery-pin-saved": "Gallery setup and the new PIN were saved.",
  "gallery-folder-created": "Gallery folder create ho gaya.",
  "gallery-synced": "Gallery subfolders aur photos Google Drive se sync ho gaye.",
  "cover-saved": "Cover photo updated."
};

const errorMessages: Record<string, string> = {
  "drive-first": "Pehle client ke liye Drive setup save karo.",
  "folder-name": "Folder create karne ke liye folder name aur Drive account dono chahiye.",
  "folder-create": "Client folder create nahi ho paaya. Google connect aur permissions check karo.",
  "gallery-first": "Pehle gallery setup save karo.",
  "gallery-folder-create": "Gallery folder create nahi ho paaya. Root folder aur Drive connection check karo.",
  "gallery-sync": "Gallery sync fail hua. Folder access aur Google connection dobara check karo.",
  "event-folder": "Gallery sync se pehle event folder ID save ya create karo.",
  "gallery-missing": "Gallery record nahi mila. Page refresh karke dobara save karo.",
  "gallery-pin": "Nayi private gallery ke liye 4 digit PIN set karo.",
  "cover-missing": "Selected cover photo current gallery mein nahi mili. Photos sync karke dobara choose karo."
};

const accountTypeOptions = [
  { label: "Client Personal", value: "CLIENT_PERSONAL" },
  { label: "Studio Workspace", value: "STUDIO_WORKSPACE" },
  { label: "Shared Drive", value: "SHARED_DRIVE" }
];

function dateInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function expiryDefault(date?: Date | null) {
  if (!date) {
    return "none";
  }

  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days <= 0 ? "none" : days <= 45 ? "30" : "90";
}

function expiryStatus(date?: Date | null) {
  if (!date) return "No expiry";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default async function EditClientPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ setup?: string; error?: string }>;
}) {
  const { id } = await params;
  const { setup, error } = await searchParams;
  const [client, galleryDefaults] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        driveAccounts: {
          orderBy: { createdAt: "desc" }
        },
        events: {
          include: {
            _count: {
              select: { albums: true, mediaFiles: true, favorites: true, downloads: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    }),
    getGalleryDefaults()
  ]);

  if (!client) {
    notFound();
  }

  const driveAccount = client.driveAccounts[0] || null;
  const primaryEvent = client.events[0] || null;
  const additionalEvents = client.events.slice(1);
  const [coverRecord, coverMediaOptions, galleryShareCode] = await Promise.all([
    primaryEvent
      ? prisma.settings.findUnique({
          where: { key: eventCoverKey(primaryEvent.id) },
          select: { value: true }
        })
      : Promise.resolve(null),
    primaryEvent
      ? prisma.mediaFile.findMany({
          where: { eventId: primaryEvent.id, driveAccountId: primaryEvent.driveAccountId, mediaType: "PHOTO" },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
          take: 300
        })
      : Promise.resolve([]),
    primaryEvent ? getGalleryShareCode(primaryEvent.id) : Promise.resolve(null)
  ]);

  const cover = parseEventCover(coverRecord?.value);
  const coverMediaId = cover.mediaFileId;
  const currentCoverMedia = coverMediaOptions.find((media) => media.id === coverMediaId) || null;
  const rootPreview =
    driveAccount?.status === "CONNECTED" && driveAccount.rootFolderId
      ? await listFiles(driveAccount.id, driveAccount.rootFolderId).catch(() => [])
      : [];
  const eventFolderPreview =
    primaryEvent && driveAccount?.status === "CONNECTED" && primaryEvent.driveFolderId
      ? await listFiles(primaryEvent.driveAccountId, primaryEvent.driveFolderId).catch(() => [])
      : [];
  const rootSubfolders = rootPreview.filter((item) => item.mimeType === FOLDER_MIME);
  const eventSubfolders = eventFolderPreview.filter((item) => item.mimeType === FOLDER_MIME);
  const setupMessage = setup ? setupMessages[setup] : "";
  const errorMessage = error ? errorMessages[error] : "";
  const galleryLink = primaryEvent && galleryShareCode
    ? buildGalleryShareUrl(
        galleryDefaults.publicDomain,
        buildGallerySharePath({ clientName: client.name, eventDate: primaryEvent.eventDate, shareCode: galleryShareCode })
      )
    : "";

  return (
    <div className="space-y-6">
      <div className="max-w-5xl">
        <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-rust">
          <ArrowLeft size={16} />
          Clients
        </Link>
        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Client workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{client.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
            Yahin se client profile, Google account connect, folder ID, gallery link, PIN, sync aur cover photo sab manage karo.
          </p>
        </div>
      </div>

      {setupMessage ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{setupMessage}</p> : null}
      {errorMessage ? <p className="rounded-md bg-rust/10 px-4 py-3 text-sm font-medium text-rust">{errorMessage}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <form action={updateClientAction.bind(null, client.id)} className="grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
            <div>
              <h2 className="text-lg font-semibold text-ink">Client details</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">Basic record yahin save hota rahega. Update ke baad isi client page par wapas aoge.</p>
            </div>
            <FormField label="Client name" name="name" defaultValue={client.name} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email" name="email" type="email" defaultValue={client.email || ""} />
              <FormField label="Phone" name="phone" defaultValue={client.phone || ""} />
            </div>
            <FormField label="City" name="city" defaultValue={client.city || ""} />
            <TextareaField label="Notes" name="notes" rows={4} defaultValue={client.notes || ""} />
            <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
              <Save size={17} />
              Update Client
            </button>
          </form>

          <div className="rounded-lg border border-marigold/30 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Google Drive setup</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Client ka Google account, root folder ID, aur custom folder create yahin manage karo.
                </p>
                {driveAccount?.status === "CONNECTED" ? (
                  <p className="mt-2 text-xs font-medium text-olive">
                    Connected once. Access renews automatically; reconnect only if Google permission is revoked.
                  </p>
                ) : null}
              </div>
              {driveAccount ? (
                <Link
                  href={`/api/google/connect?driveAccountId=${driveAccount.id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition hover:border-rust hover:text-rust"
                >
                  <LinkIcon size={16} />
                  {driveAccount.status === "CONNECTED" ? "Reconnect Google" : "Connect Google"}
                </Link>
              ) : null}
            </div>

            <form action={upsertClientDriveAccountAction.bind(null, client.id)} className="mt-5 grid gap-4">
              <input type="hidden" name="driveAccountId" value={driveAccount?.id || ""} />
              <FormField
                label="Drive label"
                name="label"
                defaultValue={driveAccount?.label || `${client.name} Drive`}
                placeholder="Client Drive"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Google email"
                  name="googleEmail"
                  type="email"
                  defaultValue={driveAccount?.googleEmail || client.email || ""}
                  placeholder="client@gmail.com"
                />
                <SelectField
                  label="Account type"
                  name="accountType"
                  options={accountTypeOptions}
                  defaultValue={driveAccount?.accountType || "CLIENT_PERSONAL"}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Root folder ID" name="rootFolderId" defaultValue={driveAccount?.rootFolderId || ""} placeholder="Paste client root folder ID" />
                <FormField label="Shared drive ID" name="sharedDriveId" defaultValue={driveAccount?.sharedDriveId || ""} placeholder="Only if shared drive is used" />
              </div>
              <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
                <Save size={17} />
                Save Drive Setup
              </button>
            </form>

            {driveAccount ? (
              <form action={createClientRootFolderAction.bind(null, client.id)} className="mt-5 grid gap-4 rounded-lg border border-ink/10 bg-ivory/60 p-4">
                <input type="hidden" name="driveAccountId" value={driveAccount.id} />
                <FormField label="Create new client folder in Drive" name="folderName" defaultValue={client.name} placeholder="Folder name" />
                <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-rust px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink">
                  <FolderPlus size={16} />
                  Create Client Folder
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Drive connect karne se pehle ek baar Drive setup save karo.</p>
            )}
          </div>

          <div className="rounded-lg border border-marigold/30 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Gallery setup</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Event name, PIN, folder ID, gallery link aur sync yahin se control karo.
            </p>

            <form action={upsertClientGalleryAction.bind(null, client.id)} className="mt-5 grid gap-4">
              <input type="hidden" name="eventId" value={primaryEvent?.id || ""} />
              <input type="hidden" name="driveAccountId" value={driveAccount?.id || ""} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Gallery name" name="name" defaultValue={primaryEvent?.name || client.name} required />
                <FormField label="Slug" name="slug" defaultValue={primaryEvent?.slug || ""} placeholder="auto from gallery name" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Event type" name="eventType" defaultValue={primaryEvent?.eventType || "Wedding"} />
                <FormField label="Event date" name="eventDate" type="date" defaultValue={dateInputValue(primaryEvent?.eventDate)} />
                <FormField label="City" name="city" defaultValue={primaryEvent?.city || client.city || ""} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField
                  label="Gallery access"
                  name="accessMode"
                  defaultValue={primaryEvent?.accessMode || "PIN"}
                  options={[
                    { label: "Private link + PIN", value: "PIN" },
                    { label: "Public link", value: "PUBLIC" }
                  ]}
                />
                <FormField
                  label={primaryEvent ? "New 4 digit PIN (optional)" : "4 digit PIN"}
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  minLength={4}
                  maxLength={4}
                  defaultValue=""
                  placeholder="1234"
                  required={!primaryEvent}
                />
                <SelectField
                  label="Gallery expiry"
                  name="expiryOption"
                  defaultValue={primaryEvent ? expiryDefault(primaryEvent.expiryDate) : "30"}
                  options={[
                    { label: "30 days from save", value: "30" },
                    { label: "90 days from save", value: "90" },
                    { label: "No expiry", value: "none" }
                  ]}
                />
                <FormField label="Gallery folder ID" name="driveFolderId" defaultValue={primaryEvent?.driveFolderId || ""} placeholder="Paste event folder ID" />
              </div>
              {primaryEvent?.accessMode === "PIN" ? (
                <p className="text-xs leading-5 text-ink/55">
                  The current PIN stays encrypted and is never displayed. Leave this field blank to keep it, or enter four new digits to replace it.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckboxField
                  label="Published"
                  name="isPublished"
                  defaultChecked={primaryEvent ? primaryEvent.isPublished : true}
                  helper="Client ko gallery open karne dena hai to published rakho."
                />
                <CheckboxField
                  label="Allow downloads"
                  name="downloadAllowed"
                  defaultChecked={primaryEvent ? primaryEvent.downloadAllowed : true}
                  helper="Gallery me download icon dikhane ke liye ye on rakho."
                />
              </div>
              <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
                <Save size={17} />
                Save Gallery Setup
              </button>
            </form>

            {primaryEvent ? (
              <dl className="mt-5 grid gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 text-sm sm:grid-cols-4">
                <div className="bg-white px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Access</dt>
                  <dd className="mt-1 font-semibold text-ink">{primaryEvent.accessMode === "PIN" ? "Private + PIN" : "Public"}</dd>
                </div>
                <div className="bg-white px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Expiry</dt>
                  <dd className="mt-1 font-semibold text-ink">{expiryStatus(primaryEvent.expiryDate)}</dd>
                </div>
                <div className="bg-white px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Gallery</dt>
                  <dd className="mt-1 font-semibold text-ink">{primaryEvent.isPublished ? "Published" : "Draft"}</dd>
                </div>
                <div className="bg-white px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Downloads</dt>
                  <dd className="mt-1 font-semibold text-ink">{primaryEvent.downloadAllowed ? "Enabled" : "Disabled"}</dd>
                </div>
              </dl>
            ) : null}

            {galleryLink ? (
              <div className="mt-5 rounded-lg border border-ink/10 bg-ivory/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Gallery link</p>
                <Link href={galleryLink} target="_blank" className="mt-2 block text-sm font-semibold text-rust hover:text-ink">
                  {galleryLink}
                </Link>
              </div>
            ) : primaryEvent ? (
              <p className="mt-5 rounded-lg border border-ink/10 bg-ivory/60 p-4 text-sm text-ink/60">
                Save Gallery Setup once to generate this client&apos;s permanent private link.
              </p>
            ) : null}

            {primaryEvent ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <form action={createClientGalleryFolderAction.bind(null, client.id)} className="rounded-lg border border-ink/10 p-4">
                  <input type="hidden" name="eventId" value={primaryEvent.id} />
                  <FormField label="Create gallery folder in Drive" name="folderName" defaultValue={primaryEvent.name} placeholder="Folder name" />
                  <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-rust px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink">
                    <FolderPlus size={16} />
                    Create Gallery Folder
                  </button>
                </form>
                <form action={syncClientGalleryFromDriveAction.bind(null, client.id)} className="rounded-lg border border-ink/10 p-4">
                  <input type="hidden" name="eventId" value={primaryEvent.id} />
                  <p className="text-sm font-medium text-ink">Sync subfolders and photos</p>
                  <p className="mt-2 text-sm leading-6 text-ink/60">
                    Event folder ke andar jo subfolders honge, woh albums banenge aur photos gallery me aa jayengi.
                  </p>
                  <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-rust hover:text-rust">
                    <RefreshCw size={16} />
                    Sync Albums & Photos
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-ink/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Current status</h2>
            <dl className="mt-5 grid gap-4 text-sm text-ink/70 sm:grid-cols-2">
              <div className="rounded-md bg-ivory px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Drive account</dt>
                <dd className="mt-1 font-semibold text-ink">{driveAccount?.label || "Not saved yet"}</dd>
              </div>
              <div className="rounded-md bg-ivory px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Google status</dt>
                <dd className="mt-1 font-semibold text-ink">{driveAccount?.status || "Not connected"}</dd>
              </div>
              <div className="rounded-md bg-ivory px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Gallery</dt>
                <dd className="mt-1 font-semibold text-ink">{primaryEvent?.name || "Not saved yet"}</dd>
              </div>
              <div className="rounded-md bg-ivory px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Imported files</dt>
                <dd className="mt-1 font-semibold text-ink">{primaryEvent?._count.mediaFiles || 0}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Client folder preview</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Root folder save hone ke baad yahan uske subfolders dikhेंगे.
            </p>
            {!driveAccount?.rootFolderId ? (
              <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Abhi client root folder set nahi hai.</p>
            ) : rootPreview.length === 0 ? (
              <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Folder connected hai, lekin visible items abhi nahi mile.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10 text-sm">
                {rootPreview.slice(0, 12).map((item) => (
                  <li key={item.id || item.name} className="px-4 py-3">
                    <p className="font-semibold text-ink">{item.name || "Untitled item"}</p>
                    <p className="mt-1 text-xs text-ink/55">
                      {item.mimeType === FOLDER_MIME ? "Folder" : item.mimeType || "Unknown"}{item.mimeType === FOLDER_MIME ? ` / ${rootSubfolders.length} folders in root` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Gallery folder preview</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Gallery folder ke andar ke subfolders albums banेंगे. Sync ke baad client page par wahi tabs dikhेंगे.
            </p>
            {!primaryEvent?.driveFolderId ? (
              <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Abhi gallery folder ID set nahi hai.</p>
            ) : eventFolderPreview.length === 0 ? (
              <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Abhi is gallery folder ke andar visible items nahi mile.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink/10 rounded-lg border border-ink/10 text-sm">
                {eventFolderPreview.slice(0, 12).map((item) => (
                  <li key={item.id || item.name} className="px-4 py-3">
                    <p className="font-semibold text-ink">{item.name || "Untitled item"}</p>
                    <p className="mt-1 text-xs text-ink/55">
                      {item.mimeType === FOLDER_MIME ? "Album folder" : item.mimeType || "Unknown"}
                      {item.mimeType === FOLDER_MIME ? ` / ${eventSubfolders.length} album folders found` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-marigold/30 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Cover photo</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Sync ke baad kisi bhi imported photo ko cover bana sakte ho. Client gallery ke top par wahi large banner me dikhegi.
            </p>

            {!primaryEvent ? (
              <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Pehle gallery setup save karo.</p>
            ) : coverMediaOptions.length === 0 ? (
              <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Photos sync hone ke baad yahan cover select kar paoge.</p>
            ) : (
              <CoverPhotoEditor
                clientId={client.id}
                eventId={primaryEvent.id}
                eventSlug={primaryEvent.slug}
                mediaOptions={coverMediaOptions}
                initialMediaId={currentCoverMedia?.id || ""}
                initialDesktopPositionX={cover.desktopPositionX}
                initialDesktopPositionY={cover.desktopPositionY}
                initialMobilePositionX={cover.mobilePositionX}
                initialMobilePositionY={cover.mobilePositionY}
              />
            )}
          </div>

          {additionalEvents.length > 0 ? (
            <div className="rounded-lg border border-ink/10 bg-white p-6">
              <h2 className="text-lg font-semibold text-ink">Other galleries</h2>
              <ul className="mt-4 divide-y divide-ink/10 text-sm">
                {additionalEvents.map((event) => (
                  <li key={event.id} className="py-3">
                    <p className="font-semibold text-ink">{event.name}</p>
                    <p className="mt-1 text-xs text-ink/55">
                      {event._count.albums} albums / {event._count.mediaFiles} files / {event.isPublished ? "Published" : "Draft"}
                    </p>
                    <Link href={`/admin/events/${event.id}`} className="mt-2 inline-flex text-xs font-semibold text-rust hover:text-ink">
                      Open full event controls
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
