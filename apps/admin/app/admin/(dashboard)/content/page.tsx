import { Save } from "lucide-react";
import { updateWebsiteContentAction } from "@/app/admin/(dashboard)/actions";
import { TextareaField } from "@/components/admin/form-controls";
import { FormField } from "@/components/admin/form-field";
import { getAboutContent, getHomeHeroContent } from "@/lib/site-content";

export default async function AdminContentPage() {
  const [hero, about] = await Promise.all([getHomeHeroContent(), getAboutContent()]);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">Content</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Website Content</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">
          Update the homepage hero and the About page copy without editing code.
        </p>
      </div>

      <form action={updateWebsiteContentAction} className="grid gap-6 rounded-lg border border-ink/10 bg-white p-6">
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-ink">Hero section</h2>
          <FormField label="Eyebrow" name="heroEyebrow" defaultValue={hero.eyebrow} required />
          <FormField label="Headline" name="heroTitle" defaultValue={hero.title} required />
          <TextareaField label="Subtitle" name="heroSubtitle" rows={3} defaultValue={hero.subtitle} required />
        </section>

        <section className="grid gap-4 border-t border-ink/10 pt-6">
          <h2 className="text-lg font-semibold text-ink">About page</h2>
          <FormField label="Heading" name="aboutHeading" defaultValue={about.heading} required />
          <TextareaField label="Paragraph 1" name="aboutParagraph1" rows={5} defaultValue={about.paragraphs[0]} required />
          <TextareaField label="Paragraph 2" name="aboutParagraph2" rows={5} defaultValue={about.paragraphs[1]} required />
          <TextareaField label="Paragraph 3" name="aboutParagraph3" rows={5} defaultValue={about.paragraphs[2]} required />
        </section>

        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-rust">
          <Save size={17} />
          Save Website Content
        </button>
      </form>
    </div>
  );
}
