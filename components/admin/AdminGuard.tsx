// 管理者ガード(クライアント側)
// トークンが無ければ /admin/login へ。API側でも毎回検証するのでここはUX目的
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAdminToken } from "@/lib/admin-client";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin || getAdminToken()) {
      setReady(true);
    } else {
      router.replace("/admin/login");
    }
  }, [isLogin, router]);

  if (!ready) return null;
  return <>{children}</>;
}
