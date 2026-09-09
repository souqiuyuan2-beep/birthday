// ホームから写真を追加する
// - どのスポットの写真かを選んでからアップロード(達成済み・挑戦中のスポットが対象)
// - ミッション画面を開かなくても、思い出をどんどん足せるようにするための導線
"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";
import { uploadPhoto } from "@/lib/upload";
import Icon from "@/components/ui/Icon";

type Target = { id: string; name: string };

export default function HomePhotoAdd({ targets }: { targets: Target[] }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  if (targets.length === 0) return null;

  function choose(id: string) {
    setSpotId(id);
    setPicking(false);
    // 選んだ直後にフォルダを開く
    setTimeout(() => inputRef.current?.click(), 0);
  }

  async function handleFiles(fileList: FileList | null) {
    const raws = [...(fileList ?? [])];
    if (raws.length === 0 || !spotId) return;
    for (let i = 0; i < raws.length; i++) {
      setProgress(`${raws.length}枚中${i + 1}枚目を送っています…`);
      let file: File;
      try {
        file = await compressImage(raws[i]);
      } catch {
        file = raws[i];
      }
      try {
        await uploadPhoto({ slug, spotId, file });
      } catch {
        setProgress("うまく送れなかったみたい。もう一度試してね");
        setTimeout(() => setProgress(null), 3000);
        return;
      }
    }
    setProgress("追加しました!");
    router.refresh();
    setTimeout(() => setProgress(null), 2000);
  }

  return (
    <div className="relative mt-7">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          void handleFiles(files);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => setPicking((v) => !v)}
        className="button-secondary w-full"
        aria-expanded={picking}
      >
        <Icon name="photo" />
        写真を追加する
      </button>

      {progress && (
        <p className="mt-2 text-center text-xs text-neutral-500">{progress}</p>
      )}

      {/* どのスポットの写真か選ぶ */}
      {picking && (
        <div className="mt-3 border border-rule bg-[#fffdf8] p-4">
          <p className="mb-2 px-1 text-xs text-neutral-500">どの場所の写真?</p>
          <ul className="space-y-1">
            {targets.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => choose(t.id)}
                  className="w-full border-b border-rule px-1 py-3 text-left text-sm text-ink transition-colors active:bg-neutral-100"
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
