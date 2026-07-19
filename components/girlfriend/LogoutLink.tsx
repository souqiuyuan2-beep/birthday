// 彼女側のログアウト(合言葉トークンを消して合言葉入力へ戻る)
"use client";

import { useParams, useRouter } from "next/navigation";
import { clearTripToken } from "@/lib/auth-client";

export default function LogoutLink() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  return (
    <button
      onClick={() => {
        clearTripToken(slug);
        router.replace("/");
      }}
      className="text-xs text-neutral-300 underline underline-offset-4"
    >
      ログアウト
    </button>
  );
}
