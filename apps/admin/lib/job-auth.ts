import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function isJobAuthorized(request: NextRequest) {
  const configured = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (configured && supplied === configured) return true;
  return Boolean(await getAdminSession());
}
