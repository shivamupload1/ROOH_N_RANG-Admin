import { prisma } from "@/lib/db";
import { parseSelectionSubmission, selectionSubmissionLookupKey, selectionSubmissionPrefix } from "@/lib/selection-submissions";

export default async function AdminFavoritesPage() {
  const [favorites, submissionSettings] = await Promise.all([
    prisma.favorite.findMany({
      include: {
        event: true,
        mediaFile: true
      },
      orderBy: { createdAt: "desc" },
      take: 300
    }),
    prisma.settings.findMany({
      where: {
        key: {
          startsWith: selectionSubmissionPrefix()
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    })
  ]);

  const submissions = submissionSettings
    .map((setting) => {
      const parsed = parseSelectionSubmission(setting.value);

      if (!parsed) {
        return null;
      }

      return {
        ...parsed,
        updatedAt: setting.updatedAt
      };
    })
    .filter((submission): submission is NonNullable<typeof submission> => Boolean(submission));

  const submittedLookup = new Map(
    submissions.map((submission) => [selectionSubmissionLookupKey(submission.eventId, submission.visitorId), submission])
  );

  const groupedFavorites = new Map<
    string,
    {
      eventId: string;
      eventName: string;
      visitorId: string;
      favoriteCount: number;
      lastSaved: Date;
      fileNames: string[];
      submittedAt?: Date;
    }
  >();

  for (const favorite of favorites) {
    const visitorId = favorite.visitorId || favorite.userId || "Unknown";
    const key = selectionSubmissionLookupKey(favorite.eventId, visitorId);
    const existing = groupedFavorites.get(key);
    const fileNames = [...(existing?.fileNames || [])];

    if (fileNames.length < 4 && !fileNames.includes(favorite.mediaFile.fileName)) {
      fileNames.push(favorite.mediaFile.fileName);
    }

    groupedFavorites.set(key, {
      eventId: favorite.eventId,
      eventName: favorite.event.name,
      visitorId,
      favoriteCount: (existing?.favoriteCount || 0) + 1,
      lastSaved: existing?.lastSaved || favorite.createdAt,
      fileNames,
      submittedAt: submittedLookup.get(key) ? new Date(submittedLookup.get(key)!.submittedAt) : undefined
    });
  }

  const favoriteSessions = Array.from(groupedFavorites.values()).sort((left, right) => right.lastSaved.getTime() - left.lastSaved.getTime());

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Favorites / Album Selection</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Live favorites are grouped by visitor session, and submitted selections are highlighted separately for album proofing.
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <div className="border-b border-ink/10 bg-ivory px-4 py-3">
          <h2 className="text-base font-semibold text-ink">Submitted selections</h2>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white text-ink/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Visitor</th>
              <th className="px-4 py-3 font-semibold">Favorites</th>
              <th className="px-4 py-3 font-semibold">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={`${submission.eventId}:${submission.visitorId}`} className="border-t border-ink/10 align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{submission.eventName}</p>
                  <p className="text-xs text-ink/45">{submission.clientName || "Private gallery"}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">{submission.visitorId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-ink/70">
                  {submission.favoriteCount}
                  <p className="mt-1 text-xs text-ink/45">{submission.fileNames.slice(0, 3).join(", ") || "No file names saved"}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">{new Date(submission.submittedAt).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {submissions.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/55" colSpan={4}>
                  No submitted selections yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <div className="border-b border-ink/10 bg-ivory px-4 py-3">
          <h2 className="text-base font-semibold text-ink">Live favorite sessions</h2>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white text-ink/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Visitor</th>
              <th className="px-4 py-3 font-semibold">Favorites</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {favoriteSessions.map((session) => (
              <tr key={`${session.eventId}:${session.visitorId}`} className="border-t border-ink/10 align-top">
                <td className="px-4 py-3 font-semibold text-ink">{session.eventName}</td>
                <td className="px-4 py-3 text-ink/70">{session.visitorId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-ink/70">
                  {session.favoriteCount}
                  <p className="mt-1 text-xs text-ink/45">{session.fileNames.join(", ") || "No file names saved"}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {session.submittedAt ? (
                    <>
                      Submitted
                      <p className="text-xs text-ink/45">{session.submittedAt.toLocaleString("en-IN")}</p>
                    </>
                  ) : (
                    <>
                      Pending
                      <p className="text-xs text-ink/45">Last saved {session.lastSaved.toLocaleString("en-IN")}</p>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {favoriteSessions.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/55" colSpan={4}>
                  No favorites saved yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
