import { NextRequest, NextResponse } from "next/server";
import { isJobAuthorized } from "@/lib/job-auth";
import { syncEventGalleryFromDrive } from "@/lib/google-drive";
import { processPreviewBatch } from "@/lib/preview-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

async function run(request: NextRequest) {
  if (!(await isJobAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId")?.trim();

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    const sync = await syncEventGalleryFromDrive(eventId);
    const previews = await processPreviewBatch(25, eventId);
    return NextResponse.json({ ok: true, sync, previews });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gallery sync failed" },
      { status: 500 }
    );
  }
}

export const GET = run;
export const POST = run;
