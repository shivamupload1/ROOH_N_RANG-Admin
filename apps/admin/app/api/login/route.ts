import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

function websiteLoginUrl(error: "credentials" | "access") {
  const fallback = process.env.NODE_ENV === "production"
    ? "https://rooh-n-rang.vercel.app"
    : "http://localhost:3000";
  const websiteUrl = process.env.WEBSITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || fallback;
  const destination = new URL("/main.html", websiteUrl);

  destination.searchParams.set("login", error);
  destination.hash = "login";
  return destination;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return NextResponse.redirect(websiteLoginUrl("credentials"), 303);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return NextResponse.redirect(websiteLoginUrl("credentials"), 303);
  }

  const admin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
      OR: [
        { authUserId: data.user.id },
        { email: { equals: data.user.email || parsed.data.email, mode: "insensitive" } }
      ]
    },
    select: { id: true, authUserId: true }
  });

  if (!admin) {
    await supabase.auth.signOut();
    return NextResponse.redirect(websiteLoginUrl("access"), 303);
  }

  if (!admin.authUserId) {
    await prisma.user.update({ where: { id: admin.id }, data: { authUserId: data.user.id } });
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
