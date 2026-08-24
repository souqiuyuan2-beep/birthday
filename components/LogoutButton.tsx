"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="w-full rounded-2xl border border-neutral-300 py-3.5 text-sm text-neutral-600"
    >
      ログアウト
    </button>
  );
}
