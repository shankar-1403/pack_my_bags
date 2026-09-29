export function Frame({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 sm:px-5">
      <div className={`mx-auto w-full max-w-7xl ${className}`}>{children}</div>
    </div>
  );
}
