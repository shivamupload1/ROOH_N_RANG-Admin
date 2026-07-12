import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  await requireAdminSession();
  const driveAccountId = request.nextUrl.searchParams.get("driveAccountId");

  if (!driveAccountId) {
    return new NextResponse("driveAccountId is required", { status: 400 });
  }

  return NextResponse.redirect(getAuthUrl(driveAccountId, request.nextUrl.origin));
}
