import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-ink/60">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-rust text-white">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink/55">{helper}</p>
    </article>
  );
}
