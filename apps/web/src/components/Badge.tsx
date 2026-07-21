interface BadgeProps {
  status: string;
}

const colors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function Badge({ status }: BadgeProps) {
  const color = colors[status] || "bg-neutral-100 text-neutral-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {status.toUpperCase()}
    </span>
  );
}
