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
      className="button-secondary w-full"
    >
      ログアウト
    </button>
  );
}
