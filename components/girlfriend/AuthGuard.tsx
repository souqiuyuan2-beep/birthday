// 合言葉ガード(クライアント側)
// トークンが無ければ合言葉入力(トップページ / )へ。URLは固定で1つ
// ※目的はサプライズ保護(要件§3.1)。書き込みの本検証はサーバー側で行う
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTripToken } from "@/lib/auth-client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getTripToken(slug)) {
      setReady(true);
    } else {
      router.replace("/");
    }
  }, [slug, router]);

  // 未認証チェックが終わるまで中身を見せない(一瞬のネタバレ防止)
  if (!ready) return null;
  return <>{children}</>;
}
