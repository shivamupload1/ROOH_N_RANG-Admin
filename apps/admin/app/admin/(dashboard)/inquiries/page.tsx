import { updateInquiryStatusAction } from "@/app/admin/(dashboard)/actions";
import { SelectField } from "@/components/admin/form-controls";
import { prisma } from "@/lib/db";

const statusOptions = [
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Booked", value: "BOOKED" },
  { label: "Archived", value: "ARCHIVED" }
];

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Phase 2</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Inquiries</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Booking inquiries from the public contact form are saved here for follow-up.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ivory text-ink/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Inquiry</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="border-t border-ink/10 align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{inquiry.name}</p>
                  <p className="text-xs text-ink/55">{inquiry.phone}</p>
                  <p className="text-xs text-ink/45">{inquiry.email || "No email"}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {inquiry.eventType || "-"}
                  <p className="text-xs text-ink/45">{inquiry.city || ""}</p>
                </td>
                <td className="max-w-sm px-4 py-3 text-ink/70">{inquiry.message || "-"}</td>
                <td className="px-4 py-3">
                  <form action={updateInquiryStatusAction.bind(null, inquiry.id)} className="flex items-end gap-2">
                    <SelectField label="Status" name="status" options={statusOptions} defaultValue={inquiry.status} />
                    <button type="submit" className="h-10 rounded-md bg-ink px-3 text-xs font-semibold text-ivory hover:bg-rust">
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {inquiries.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/55" colSpan={4}>
                  No inquiries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
