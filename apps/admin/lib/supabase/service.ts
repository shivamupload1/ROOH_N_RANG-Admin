import { createClient } from "@supabase/supabase-js";

function serviceRoleKey() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY (or legacy service_role key) is required for preview storage.");

  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1] || "", "base64url").toString("utf8")) as { role?: string };
    if (payload.role && payload.role !== "service_role") {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not a service_role token.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("service_role")) throw error;
  }

  return key;
}

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");

  return createClient(url, serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
