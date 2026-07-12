import Link from "next/link";
import { Edit3, FolderOpen, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { deleteClientAction } from "@/app/admin/(dashboard)/actions";
import { prisma } from "@/lib/db";

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: { events: true, driveAccounts: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Clients</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
            Manage client profiles before creating their events, albums, and Drive-backed galleries.
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ivory transition hover:bg-rust"
        >
          <Plus size={17} />
          Add Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={Plus} title="No clients yet" description="Create your first client to start an event gallery." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-ivory text-ink/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Events</th>
                <th className="px-4 py-3 font-semibold">Drive</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{client.name}</p>
                    <p className="text-xs text-ink/55">{client.email || "No email"}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{client.phone || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{client.city || "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{client._count.events}</td>
                  <td className="px-4 py-3 text-ink/70">{client._count.driveAccounts}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-3 text-xs font-semibold text-ink transition hover:border-rust hover:text-rust"
                        title="Open client page"
                      >
                        <FolderOpen size={15} />
                        Open Client Page
                      </Link>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                        title="Edit client"
                      >
                        <Edit3 size={16} />
                      </Link>
                      <form action={deleteClientAction.bind(null, client.id)}>
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 text-ink transition hover:border-rust hover:text-rust"
                          title="Delete client"
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
