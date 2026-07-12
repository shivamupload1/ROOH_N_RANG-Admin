"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    return {
      error: "Invalid admin email or password."
    };
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
    return { error: "This account does not have admin access." };
  }

  if (!admin.authUserId) {
    await prisma.user.update({ where: { id: admin.id }, data: { authUserId: data.user.id } });
  }

  redirect("/admin");
}
