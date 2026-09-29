export const inputClass =
  "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-mist">{label}</span>
      {children}
    </label>
  );
}
