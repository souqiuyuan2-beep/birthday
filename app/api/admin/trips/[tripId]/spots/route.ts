// A4の裏側: スポットの追加・並び替え
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";

type Ctx = { params: Promise<{ tripId: string }> };

// POST body(任意): { sortOrder } — 指定するとその番目の「選択肢」として追加(2択化)。
// 未指定なら末尾に新しい番目として追加
export async function POST(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const { sortOrder } = (await req.json().catch(() => ({}))) as {
    sortOrder?: number;
  };
  const supabase = createServerClient();

  let order: number;
  if (typeof sortOrder === "number") {
    order = sortOrder;
    // 進行が始まった番目には選択肢を追加できない(彼女が選べず詰むため)
    const { data: groupSpots } = await supabase
      .from("spots")
      .select("id")
      .eq("trip_id", tripId)
      .eq("sort_order", order);
    const ids = (groupSpots ?? []).map((s) => s.id);
    if (ids.length >= 5) {
      return NextResponse.json(
        { error: "選択肢は1つの番目につき最大5個までです" },
        { status: 409 }
      );
    }
    if (ids.length > 0) {
      const { data: started } = await supabase
        .from("progress")
        .select("spot_id")
        .in("spot_id", ids);
      if (started && started.length > 0) {
        return NextResponse.json(
          { error: "この番目は達成済みのため、選択肢を追加できません" },
          { status: 409 }
        );
      }
    }
    // 既に選択済みの2択に後から追加されても壊れないよう、選択状態はリセット
    await supabase
      .from("spots")
      .update({ chosen: false })
      .eq("trip_id", tripId)
      .eq("sort_order", order);
  } else {
    const { data: last } = await supabase
      .from("spots")
      .select("sort_order")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (last?.sort_order ?? 0) + 1;
  }

  const { data: spot, error } = await supabase
    .from("spots")
    .insert({
      trip_id: tripId,
      sort_order: order,
      name: "新しいスポット",
      mission: "",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ spot });
}

// PUT { orderedGroups: string[][] } → グループ(番目)単位で sort_order を振り直す。
// 2択の選択肢は同じグループに入れて渡す(同じ sort_order が付く)
export async function PUT(req: Request, { params }: Ctx) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const { orderedGroups } = (await req.json().catch(() => ({}))) as {
    orderedGroups?: string[][];
  };
  if (
    !Array.isArray(orderedGroups) ||
    orderedGroups.length === 0 ||
    !orderedGroups.every((g) => Array.isArray(g) && g.length > 0)
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const supabase = createServerClient();
  // 一時的な負の値を経由して、途中状態でも既存の並びとぶつからないようにする
  for (let i = 0; i < orderedGroups.length; i++) {
    const { error } = await supabase
      .from("spots")
      .update({ sort_order: -(i + 1) })
      .in("id", orderedGroups[i])
      .eq("trip_id", tripId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  for (let i = 0; i < orderedGroups.length; i++) {
    const { error } = await supabase
      .from("spots")
      .update({ sort_order: i + 1 })
      .in("id", orderedGroups[i])
      .eq("trip_id", tripId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
