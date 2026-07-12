export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6">
      <div className="h-3 w-24 rounded-md bg-ink/10" />
      <div className="mt-4 space-y-3">
        <div className="h-4 rounded-md bg-ink/10" />
        <div className="h-4 w-3/4 rounded-md bg-ink/10" />
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
