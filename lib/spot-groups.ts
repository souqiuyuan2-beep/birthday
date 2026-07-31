// スポットのグループ化ロジック(彼女側ホーム・ミッション・選択APIで共用)
//
// - 同じ sort_order のスポット同士が「選択肢グループ」。1件なら通常スポット、
//   複数なら彼女が選ぶまで effective は null(選択待ち)
// - parent_spot_id を持つスポットは「その親が選ばれた時だけ現れる」分岐。
//   親が選ばれていないグループは、そもそも旅の道筋に出てこない
import type { Progress, Spot } from "@/lib/supabase/types";

export type SpotGroup = {
  sortOrder: number;
  options: Spot[];
  effective: Spot | null; // このグループで実際に進行対象になるスポット
  done: boolean;
};

export function buildSpotGroups(
  spots: Spot[],
  progress: Pick<Progress, "spot_id">[]
): SpotGroup[] {
  const doneIds = new Set(progress.map((p) => p.spot_id));
  const chosenIds = new Set(spots.filter((s) => s.chosen).map((s) => s.id));

  // 分岐スポットは、親が「選ばれた or 達成済み」のときだけ道筋に含める
  const visible = spots.filter((s) => {
    if (!s.parent_spot_id) return true;
    return chosenIds.has(s.parent_spot_id) || doneIds.has(s.parent_spot_id);
  });

  const byOrder = new Map<number, Spot[]>();
  for (const spot of visible) {
    const list = byOrder.get(spot.sort_order) ?? [];
    list.push(spot);
    byOrder.set(spot.sort_order, list);
  }

  return [...byOrder.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sortOrder, options]) => {
      // 進行済みのスポットが最優先(達成後にグループ構成が変わっても矛盾しないように)
      const effective =
        options.find((o) => doneIds.has(o.id)) ??
        (options.length === 1
          ? options[0]
          : (options.find((o) => o.chosen) ?? null));
      return {
        sortOrder,
        options,
        effective,
        done: effective ? doneIds.has(effective.id) : false,
      };
    });
}

// 先頭から見て最初の未達成グループが「挑戦中」
export function currentGroupIndex(groups: SpotGroup[]): number {
  return groups.findIndex((g) => !g.done);
}
