import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Login"
};

function websiteLoginUrl() {
  const fallback = process.env.NODE_ENV === "production"
    ? "https://rooh-n-rang.vercel.app"
    : "http://localhost:3000";
  const websiteUrl = process.env.WEBSITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || fallback;

  return `${websiteUrl.replace(/\/$/, "")}/main.html#login`;
}

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  redirect(session ? "/admin" : websiteLoginUrl());
}
