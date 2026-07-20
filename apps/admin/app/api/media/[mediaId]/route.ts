import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchDriveFileAsset } from "@/lib/google-drive";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const session = await getAdminSession();

  if (!session) {
    return new NextResponse("Admin sign-in required", { status: 401 });
  }

  const { mediaId } = await params;
  const media = await prisma.mediaFile.findUnique({ where: { id: mediaId } });

  if (!media) {
    return new NextResponse("Media not found", { status: 404 });
  }

  try {
    if (media.previewStoragePath) {
      const supabase = createSupabaseServiceClient();
      const preview = await supabase.storage
        .from(process.env.SUPABASE_PREVIEW_BUCKET || "gallery-previews")
        .download(media.previewStoragePath);

      if (preview.data && !preview.error) {
        return new NextResponse(await preview.data.arrayBuffer(), {
          headers: {
            "content-type": media.previewMimeType || "image/jpeg",
            "cache-control": "private, max-age=86400, stale-while-revalidate=604800"
          }
        });
      }
    }

    const source = await fetchDriveFileAsset({
      driveAccountId: media.driveAccountId,
      fileId: media.driveFileId,
      thumbnailUrl: media.thumbnailUrl,
      preferThumbnail: Boolean(media.thumbnailUrl),
      fallbackToMedia: true
    });

    return new NextResponse(await source.arrayBuffer(), {
      headers: {
        "content-type": source.headers.get("content-type") || media.mimeType || "application/octet-stream",
        "cache-control": "private, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch {
    return new NextResponse("Could not load this Google Drive file right now.", { status: 502 });
  }
}
