/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/app/admin/login/login-form";
import { getAdminSession } from "@/lib/auth";
import { brand } from "@/lib/content";

export const metadata: Metadata = {
  title: "Admin Login"
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-visual">
        <img src="/admin/studio-bg.jpg" alt="Rooh N Rang wedding story" />
        <div />
        <Link href="/" className="admin-login-back"><ArrowLeft size={16} />Back to website</Link>
        <p><span>ROOH <i>N</i> RANG</span><small>Stories held with feeling.</small></p>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card">
          <span className="admin-login-mark"><ShieldCheck size={20} /></span>
          <p className="admin-login-eyebrow">Editorial Studio</p>
          <h1>{brand.name}</h1>
          <p className="admin-login-copy">Sign in to manage client galleries, website content, Drive media and delivery activity.</p>
          <LoginForm />
          <small className="admin-login-note">Protected studio access · 8 hour secure session</small>
        </div>
      </section>
    </main>
  );
}
