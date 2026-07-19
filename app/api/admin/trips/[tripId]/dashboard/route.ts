// A5の裏側: ダッシュボード用データ(達成状況+写真フィード)
// GET → { total, doneCount, currentName, allDone, photos: 新しい順(署名付きURL) }
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin-api";
import { buildSpotGroups, currentGroupIndex } from "@/lib/spot-groups";
import type { Photo, Progress, Spot } from "@/lib/supabase/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tripId } = await params;
  const supabase = createServerClient();

  const [{ data: spots }, { data: progress }, { data: photos }] =
    (await Promise.all([
      supabase
        .from("spots")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order", { ascending: true }),
      supabase.from("progress").select("*").eq("trip_id", tripId),
      supabase
        .from("photos")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false }),
    ])) as [
      { data: Spot[] | null },
      { data: Progress[] | null },
      { data: Photo[] | null },
    ];

  const groups = buildSpotGroups(spots ?? [], progress ?? []);
  const currentIdx = currentGroupIndex(groups);
  const current = currentIdx >= 0 ? groups[currentIdx] : null;
  const currentName = current
    ? (current.effective?.name ?? "(2択を選び中)")
    : null;

  const photoList = photos ?? [];
  const { data: signed } =
    photoList.length > 0
      ? await supabase.storage.from("photos").createSignedUrls(
          photoList.map((p) => p.storage_path),
          60 * 60
        )
      : { data: [] };
  const spotName = new Map((spots ?? []).map((s) => [s.id, s.name]));

  return NextResponse.json({
    total: groups.length,
    doneCount: groups.filter((g) => g.done).length,
    allDone: groups.length > 0 && groups.every((g) => g.done),
    currentName,
    photos: photoList.flatMap((photo, i) => {
      const url = signed?.[i]?.signedUrl;
      if (!url) return [];
      return [
        {
          id: photo.id,
          url,
          spotName: spotName.get(photo.spot_id) ?? "",
          createdAt: photo.created_at,
        },
      ];
    }),
  });
}
