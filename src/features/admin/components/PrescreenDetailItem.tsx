export function PrescreenDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption text-ink-3">{label}</span>
      <span className="text-body-md font-semibold text-ink capitalize">{value}</span>
    </div>
  );
}
