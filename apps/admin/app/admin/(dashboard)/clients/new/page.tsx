import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createClientAction } from "@/app/admin/(dashboard)/actions";
import { FormField } from "@/components/admin/form-field";
import { TextareaField } from "@/components/admin/form-controls";

export default function NewClientPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-rust">
        <ArrowLeft size={16} />
        Clients
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">New client</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Add Client</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Client save hote hi direct client workspace khulega, jahan se Google account connect, folder create, gallery link, PIN aur sync sab ek hi jagah se hoga.
        </p>
      </div>

      <form action={createClientAction} className="mt-6 grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
        <FormField label="Client name" name="name" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" />
          <FormField label="Phone" name="phone" />
        </div>
        <FormField label="City" name="city" />
        <TextareaField label="Notes" name="notes" rows={4} />
        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
          <Save size={17} />
          Save Client
        </button>
      </form>
    </div>
  );
}
