// A3の裏側: 旅の進捗リセット(リハーサル後に本番状態へ戻すため)
// POST { keepPhotos?: boolean }
//   既定        : 達成記録・写真(Storage実体含む)・多択の選択をすべて消す
//   keepPhotos  : 写真は残し、達成記録と選択だけ消す
// プラン(旅行・スポットの内容)は消さない
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const { keepPhotos } = (await req.json().catch(() => ({}))) as {
    keepPhotos?: boolean;
  };
  const supabase = createServerClient();

  if (!keepPhotos) {
    // Storageの実ファイルも消す(残すとゴミが溜まる)
    const { data: photos } = await supabase
      .from("photos")
      .select("storage_path")
      .eq("trip_id", tripId);
    if (photos?.length) {
      await supabase.storage
        .from("photos")
        .remove(photos.map((p) => p.storage_path));
    }
    const { error: photoError } = await supabase
      .from("photos")
      .delete()
      .eq("trip_id", tripId);
    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }
  }

  const { error: progressError } = await supabase
    .from("progress")
    .delete()
    .eq("trip_id", tripId);
  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  // 多択の選択もリセット(また選び直せるように)
  const { error: chosenError } = await supabase
    .from("spots")
    .update({ chosen: false })
    .eq("trip_id", tripId);
  if (chosenError) {
    return NextResponse.json({ error: chosenError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
