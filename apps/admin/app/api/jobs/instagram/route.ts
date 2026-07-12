import { NextRequest, NextResponse } from "next/server";
import { isJobAuthorized } from "@/lib/job-auth";
import { syncInstagramPosts } from "@/lib/instagram";

export const runtime = "nodejs";

async function run(request: NextRequest) {
  if (!(await isJobAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await syncInstagramPosts());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Instagram sync failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
