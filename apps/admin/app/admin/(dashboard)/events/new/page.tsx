import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createEventAction } from "@/app/admin/(dashboard)/actions";
import { EventFormFields } from "@/components/admin/event-form-fields";
import { prisma } from "@/lib/db";

export default async function NewEventPage() {
  const [clients, driveAccounts] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.driveAccount.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/events" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-rust">
        <ArrowLeft size={16} />
        Events
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">New event</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Create Event Gallery</h1>
      </div>

      <form action={createEventAction} className="mt-6 grid gap-4 rounded-lg border border-ink/10 bg-white p-6">
        <EventFormFields clients={clients} driveAccounts={driveAccounts} />
        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
          <Save size={17} />
          Save Event
        </button>
      </form>
    </div>
  );
}
