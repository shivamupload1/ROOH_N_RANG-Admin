import { NextRequest, NextResponse } from "next/server";
import { isJobAuthorized } from "@/lib/job-auth";
import { processPreviewBatch } from "@/lib/preview-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

async function run(request: NextRequest) {
  if (!(await isJobAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Number(request.nextUrl.searchParams.get("limit") || 4);
  return NextResponse.json(await processPreviewBatch(limit));
}

export const GET = run;
export const POST = run;
