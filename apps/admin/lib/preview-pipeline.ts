import { PreviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fetchDriveFileAsset } from "@/lib/google-drive";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const bucket = process.env.SUPABASE_PREVIEW_BUCKET || "gallery-previews";

async function ensureBucket() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage.getBucket(bucket);

  if (!data && error) {
    const created = await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/webp", "image/png"]
    });
    if (created.error) throw created.error;
  }

  return supabase;
}

export async function processPreviewBatch(limit = 4) {
  const take = Math.max(1, Math.min(limit, 10));
  const mediaFiles = await prisma.mediaFile.findMany({
    where: {
      mediaType: "PHOTO",
      previewStatus: PreviewStatus.PENDING,
      driveAccount: { status: "CONNECTED" }
    },
    orderBy: { createdAt: "asc" },
    take,
    select: {
      id: true,
      eventId: true,
      driveAccountId: true,
      driveFileId: true,
      thumbnailUrl: true,
      width: true,
      height: true
    }
  });

  if (mediaFiles.length === 0) return { queued: 0, ready: 0, failed: 0 };
  const supabase = await ensureBucket();
  let ready = 0;
  let failed = 0;

  for (const mediaFile of mediaFiles) {
    await prisma.mediaFile.update({
      where: { id: mediaFile.id },
      data: { previewStatus: PreviewStatus.PROCESSING, previewError: null }
    });

    try {
      const highResolutionThumbnail = mediaFile.thumbnailUrl?.replace(/=s\d+(?:-[a-z0-9-]+)?$/i, "=s2200");
      const source = await fetchDriveFileAsset({
        driveAccountId: mediaFile.driveAccountId,
        fileId: mediaFile.driveFileId,
        thumbnailUrl: highResolutionThumbnail,
        preferThumbnail: Boolean(highResolutionThumbnail),
        fallbackToMedia: !highResolutionThumbnail
      });
      const data = Buffer.from(await source.arrayBuffer());
      const contentType = source.headers.get("content-type") || "image/jpeg";
      const storagePath = `${mediaFile.eventId}/${mediaFile.id}.preview`;
      const upload = await supabase.storage.from(bucket).upload(storagePath, data, {
        contentType,
        cacheControl: "31536000",
        upsert: true
      });
      if (upload.error) throw upload.error;

      await prisma.mediaFile.update({
        where: { id: mediaFile.id },
        data: {
          previewStatus: PreviewStatus.READY,
          previewStoragePath: storagePath,
          previewWidth: mediaFile.width,
          previewHeight: mediaFile.height,
          previewBytes: data.length,
          previewMimeType: contentType,
          previewGeneratedAt: new Date(),
          previewError: null
        }
      });
      ready += 1;
    } catch (error) {
      await prisma.mediaFile.update({
        where: { id: mediaFile.id },
        data: {
          previewStatus: PreviewStatus.FAILED,
          previewError: (error instanceof Error ? error.message : "Preview generation failed").slice(0, 500)
        }
      });
      failed += 1;
    }
  }

  return { queued: mediaFiles.length, ready, failed };
}
