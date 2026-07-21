export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
    </div>
  );
}
