"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <input
        className={`w-full border ${error ? "border-red-500" : "border-neutral-300"} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
