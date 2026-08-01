// 番目グループを「旅行先を選ぶステップ」にする / 解除する
// PUT { sortOrder, isDestination } — 同じ番目のスポットすべてに印を付け外しする
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const { sortOrder, isDestination } = (await req.json().catch(() => ({}))) as {
    sortOrder?: number;
    isDestination?: boolean;
  };
  if (typeof sortOrder !== "number" || typeof isDestination !== "boolean") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("spots")
    .update({ is_destination: isDestination })
    .eq("trip_id", tripId)
    .eq("sort_order", sortOrder);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
