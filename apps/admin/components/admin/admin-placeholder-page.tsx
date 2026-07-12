import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
};

export function AdminPlaceholderPage({ title, description, icon, phase = "Phase 2" }: AdminPlaceholderPageProps) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rust">{phase}</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">{description}</p>
      </div>
      <EmptyState icon={icon} title={`${title} is ready for wiring`} description={description} />
    </div>
  );
}
