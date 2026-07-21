"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "./Button";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-neutral-900">AI Task Platform</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600">{user?.name}</span>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
