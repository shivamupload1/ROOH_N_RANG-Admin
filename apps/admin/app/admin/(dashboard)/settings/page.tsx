import { Save } from "lucide-react";
import { updateStudioSettingsAction } from "@/app/admin/(dashboard)/actions";
import { CheckboxField, SelectField } from "@/components/admin/form-controls";
import { FormField } from "@/components/admin/form-field";
import { getGalleryDefaults, getSiteBrand } from "@/lib/site-content";

export default async function AdminSettingsPage() {
  const [brand, galleryDefaults] = await Promise.all([getSiteBrand(), getGalleryDefaults()]);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Studio Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Manage brand details, contact info, and default gallery rules used by the studio.
        </p>
      </div>

      <form action={updateStudioSettingsAction} className="grid gap-6 rounded-lg border border-ink/10 bg-white p-6">
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-ink">Brand</h2>
          <FormField label="Studio name" name="brandName" defaultValue={brand.name} required />
          <FormField label="Tagline" name="tagline" defaultValue={brand.tagline} required />
          <FormField label="City" name="city" defaultValue={brand.city} required />
        </section>

        <section className="grid gap-4 border-t border-ink/10 pt-6">
          <h2 className="text-lg font-semibold text-ink">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="WhatsApp" name="whatsapp" defaultValue={brand.whatsapp} required />
            <FormField label="Email" name="email" type="email" defaultValue={brand.email} required />
          </div>
          <FormField label="Instagram" name="instagram" defaultValue={brand.instagram} required />
        </section>

        <section className="grid gap-4 border-t border-ink/10 pt-6">
          <h2 className="text-lg font-semibold text-ink">Gallery defaults</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Default expiry"
              name="defaultExpiryDays"
              defaultValue={String(galleryDefaults.defaultExpiryDays)}
              options={[
                { label: "No expiry", value: "0" },
                { label: "30 days", value: "30" },
                { label: "90 days", value: "90" }
              ]}
            />
            <FormField label="Public domain" name="publicDomain" defaultValue={galleryDefaults.publicDomain} required />
          </div>
          <CheckboxField
            label="Allow downloads by default"
            name="allowDownloadsByDefault"
            defaultChecked={galleryDefaults.allowDownloadsByDefault}
            helper="Admins can still override downloads per event and per media file."
          />
        </section>

        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
          <Save size={17} />
          Save Settings
        </button>
      </form>
    </div>
  );
}
