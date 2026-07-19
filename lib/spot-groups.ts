// 2択スポットのグループ化ロジック(彼女側ホーム・ミッション・選択APIで共用)
// 同じ sort_order のスポット同士が選択肢グループ。1件なら通常スポット、
// 2件なら彼女が選ぶまで effective は null(選択待ち)
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
  const byOrder = new Map<number, Spot[]>();
  for (const spot of spots) {
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
