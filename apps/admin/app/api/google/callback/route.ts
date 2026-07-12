import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Google OAuth callback is missing code/state.", { status: 400 });
  }

  try {
    await handleOAuthCallback(code, state, request.nextUrl.origin);
    return NextResponse.redirect(new URL("/admin/drive-accounts?googleStatus=connected", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Drive connection failed.";
    const redirectUrl = new URL("/admin/drive-accounts", request.url);
    redirectUrl.searchParams.set("googleStatus", "error");
    redirectUrl.searchParams.set("googleMessage", message.slice(0, 160));
    return NextResponse.redirect(redirectUrl);
  }
}
