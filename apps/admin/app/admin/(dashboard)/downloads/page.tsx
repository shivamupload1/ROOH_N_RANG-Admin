import { prisma } from "@/lib/db";

export default async function AdminDownloadsPage() {
  const downloads = await prisma.download.findMany({
    include: {
      event: true,
      mediaFile: true
    },
    orderBy: { downloadedAt: "desc" },
    take: 100
  });

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Downloads</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Download clicks are logged here when gallery visitors use enabled download buttons.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ivory text-ink/70">
            <tr>
              <th className="px-4 py-3 font-semibold">File</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Visitor</th>
              <th className="px-4 py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {downloads.map((download) => (
              <tr key={download.id} className="border-t border-ink/10">
                <td className="px-4 py-3 font-semibold text-ink">{download.mediaFile.fileName}</td>
                <td className="px-4 py-3 text-ink/70">{download.event.name}</td>
                <td className="px-4 py-3 text-ink/70">
                  {download.visitorId?.slice(0, 8) || "User"}
                  <p className="text-xs text-ink/45">{download.ipAddress || ""}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">{download.downloadedAt.toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {downloads.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/55" colSpan={4}>
                  No downloads tracked yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
