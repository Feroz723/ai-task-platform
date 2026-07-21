import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`border border-neutral-200 rounded-lg bg-white ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
