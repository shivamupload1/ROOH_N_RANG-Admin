import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderSearch, Link as LinkIcon, Save } from "lucide-react";
import { updateDriveAccountAction } from "@/app/admin/(dashboard)/actions";
import { DriveAccountFormFields } from "@/components/admin/drive-account-form-fields";
import { prisma } from "@/lib/db";
import { listFiles } from "@/lib/google-drive";

function formatDateTime(value?: Date | null) {
  return value ? value.toLocaleString("en-IN") : "Not available";
}

export default async function EditDriveAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [driveAccount, clients] = await Promise.all([
    prisma.driveAccount.findUnique({
      where: { id },
      include: {
        client: true,
        _count: {
          select: { events: true, mediaFiles: true }
        }
      }
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!driveAccount) {
    notFound();
  }

  let previewFiles: Array<{ id?: string | null; name?: string | null; mimeType?: string | null }> = [];
  let previewError = "";

  if (driveAccount.status === "CONNECTED" && driveAccount.rootFolderId) {
    try {
      previewFiles = (await listFiles(driveAccount.id, driveAccount.rootFolderId)).slice(0, 8);
    } catch (error) {
      previewError = error instanceof Error ? error.message : "Could not load root folder preview.";
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="max-w-3xl">
        <Link href="/admin/drive-accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-rust">
          <ArrowLeft size={16} />
          Drive Accounts
        </Link>
        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Edit Drive account</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{driveAccount.label}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Save the folder IDs you want this account to use, then reconnect Google if needed and create event folders from the event page.
          </p>
        </div>

        <form action={updateDriveAccountAction.bind(null, driveAccount.id)} className="mt-6 grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
          <DriveAccountFormFields clients={clients} driveAccount={driveAccount} />
          <p className="rounded-md bg-ivory px-3 py-2 text-xs leading-5 text-ink/55">
            Use root folder ID when all event folders should stay under one parent folder. Shared drive ID is only needed for Google Workspace shared drives.
          </p>
          <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
            <Save size={17} />
            Update Drive Account
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <div className="rounded-lg border border-ink/10 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Connection status</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Connected email fills after Google OAuth. Reconnect any time if Drive access expires or changes.
              </p>
            </div>
            <Link
              href={`/api/google/connect?driveAccountId=${driveAccount.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition hover:border-rust hover:text-rust"
            >
              <LinkIcon size={16} />
              {driveAccount.status === "CONNECTED" ? "Reconnect Google" : "Connect Google"}
            </Link>
          </div>

          <dl className="mt-5 grid gap-4 text-sm text-ink/70 sm:grid-cols-2">
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Status</dt>
              <dd className="mt-1 font-semibold text-ink">{driveAccount.status}</dd>
            </div>
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Google email</dt>
              <dd className="mt-1 font-semibold text-ink">{driveAccount.googleEmail || "Will fill after OAuth"}</dd>
            </div>
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Token expiry</dt>
              <dd className="mt-1 font-semibold text-ink">{formatDateTime(driveAccount.tokenExpiry)}</dd>
            </div>
            <div className="rounded-md bg-ivory px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">Usage</dt>
              <dd className="mt-1 font-semibold text-ink">
                {driveAccount._count.events} events / {driveAccount._count.mediaFiles} files
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-marigold/30 bg-white p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-ivory p-2 text-rust">
              <FolderSearch size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink">Root folder preview</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                This is a quick check of the saved root folder. If it looks wrong, update the root folder ID and reconnect if required.
              </p>
            </div>
          </div>

          {!driveAccount.rootFolderId ? (
            <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">Save a root folder ID first to preview its files.</p>
          ) : previewError ? (
            <p className="mt-4 rounded-md bg-rust/10 px-4 py-3 text-sm font-medium text-rust">{previewError}</p>
          ) : previewFiles.length === 0 ? (
            <p className="mt-4 rounded-md bg-ivory px-4 py-3 text-sm text-ink/60">No visible files found in the saved root folder yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-ink/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-ivory text-ink/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {previewFiles.map((file) => (
                    <tr key={file.id || file.name} className="border-t border-ink/10">
                      <td className="px-4 py-3 font-medium text-ink">{file.name || "Untitled file"}</td>
                      <td className="px-4 py-3 text-ink/65">{file.mimeType || "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
