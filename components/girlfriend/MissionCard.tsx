// G4+G5のクライアント部分: ミッションカード+撮影・アップロードUI
// - カメラ起動 or フォルダから複数枚選択 → 圧縮(EXIF除去) → 1枚ずつリトライ付きアップロード
// - 失敗時は残りのキューを保持して手動リトライ(途中から再開)
// - 写真は×ボタンで削除可(達成状態は維持=撮り直しできる)
"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { compressImage } from "@/lib/image";
import { uploadPhoto } from "@/lib/upload";
import Icon from "@/components/ui/Icon";

type PhotoItem = { id: string; url: string };

type Props = {
  spotId: string;
  displayName: string;
  mission: string;
  hint: string | null;
  message: string | null;
  done: boolean;
  initialPhotos: PhotoItem[];
  reselectOrder: number | null; // 多択で写真前なら選び直しリンクを出す番目
  photoRequired: boolean; // false なら写真なしでも達成にできる
  completeLabel: string; // 写真なしで達成するボタンの文言
  nextHref: string; // 達成演出から次へ進む先(最後ならエンディング)
  nextLabel: string;
};

type UploadState =
  | { phase: "idle" }
  | { phase: "compressing"; total: number }
  | { phase: "uploading"; percent: number; index: number; total: number }
  | { phase: "error"; queue: File[]; total: number };

export default function MissionCard({
  spotId,
  displayName,
  mission,
  hint,
  message,
  done,
  initialPhotos,
  reselectOrder,
  photoRequired,
  completeLabel,
  nextHref,
  nextLabel,
}: Props) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [isDone, setIsDone] = useState(done);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [showHint, setShowHint] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    const raws = [...(fileList ?? [])];
    if (raws.length === 0) return;
    setState({ phase: "compressing", total: raws.length });
    const files: File[] = [];
    for (const raw of raws) {
      try {
        files.push(await compressImage(raw));
      } catch {
        // 圧縮に失敗しても原本で続行(サイズは大きくなるが体験を止めない)
        files.push(raw);
      }
    }
    await uploadQueue(files, files.length);
  }

  // キューを1枚ずつアップロード。失敗したらその時点の残りを保持して再開できるようにする
  async function uploadQueue(queue: File[], total: number) {
    let completedNow = false;
    for (let i = 0; i < queue.length; i++) {
      const index = total - queue.length + i + 1;
      setState({ phase: "uploading", percent: 0, index, total });
      try {
        const result = await uploadPhoto({
          slug,
          spotId,
          file: queue[i],
          onProgress: (percent) =>
            setState({ phase: "uploading", percent, index, total }),
        });
        if (result.signedUrl) {
          setPhotos((list) => [
            ...list,
            { id: result.photoId, url: result.signedUrl! },
          ]);
        }
        if (result.completedNow) {
          completedNow = true;
          setIsDone(true);
        }
      } catch {
        setState({ phase: "error", queue: queue.slice(i), total });
        return;
      }
    }
    setState({ phase: "idle" });
    if (completedNow) setCelebrating(true);
    router.refresh();
  }

  // 写真が任意のスポットを、写真なしで達成にする
  async function completeWithoutPhoto() {
    if (busy) return;
    const res = await fetch(`/api/t/${slug}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ spotId }),
    });
    if (res.ok) {
      setIsDone(true);
      setCelebrating(true);
      router.refresh();
    }
  }

  async function deletePhoto(photo: PhotoItem) {
    const warn =
      photos.length === 1 && photoRequired
        ? "これが最後の1枚だよ。削除するとこのスポットの写真が0枚になるけど、本当に削除する?"
        : "この写真を削除する?";
    if (!confirm(warn)) return;
    const res = await fetch(`/api/t/${slug}/photos/${photo.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      router.refresh();
    }
  }

  const busy = state.phase === "compressing" || state.phase === "uploading";

  return (
    <main className="journal-page journey-page flex flex-col">
      <button
        onClick={() => router.push(`/t/${slug}`)}
        className="back-link self-start"
      >
        ← 戻る
      </button>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mission-sheet"
      >
        <p className="eyebrow mb-3">
          {isDone ? "A MEMORY COLLECTED" : "A MOMENT TO COLLECT"}
        </p>
        <h1 className="page-title">{displayName}</h1>
        <p className="mt-6 text-[15px] leading-loose text-ink">{mission}</p>

        {hint && (
          <div className="mt-4">
            <button
              onClick={() => setShowHint((v) => !v)}
              className="text-link text-theme underline"
              aria-expanded={showHint}
            >
              {showHint ? "ヒントを閉じる" : "ヒントを見る"}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden text-sm text-neutral-500"
                >
                  {hint}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {message && (
          <p className="mt-7 border-l-2 border-rule pl-5 font-serif text-sm leading-loose text-muted">
            {message}
          </p>
        )}
      </motion.section>

      {reselectOrder !== null && (
        <button
          onClick={() => router.push(`/t/${slug}/choice/${reselectOrder}`)}
          className="mt-4 self-center text-sm text-theme-deep underline underline-offset-4"
        >
          ほかの場所を選び直す
        </button>
      )}

      {photos.length > 0 && (
        <div className="mt-6 flex gap-3 overflow-x-auto p-2">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`撮った写真 ${i + 1}`}
                className="h-36 w-28 object-cover"
              />
              <button
                onClick={() => deletePhoto(photo)}
                aria-label="写真を削除"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-700/80 text-xs text-white shadow"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-8">
        {state.phase === "uploading" && (
          <div className="mb-4">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-theme transition-all"
                style={{ width: `${state.percent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-neutral-400">
              {state.total > 1
                ? `${state.total}枚中${state.index}枚目を送っています… ${state.percent}%`
                : `送っています… ${state.percent}%`}
            </p>
          </div>
        )}
        {state.phase === "compressing" && (
          <p className="mb-4 text-center text-xs text-neutral-400">
            {state.total > 1
              ? `${state.total}枚の写真を準備しています…`
              : "準備しています…"}
          </p>
        )}
        {state.phase === "error" && (
          <div className="mb-4 text-center">
            <p className="text-sm text-red-400">
              うまく送れなかったみたい(電波のせいかも)
              {state.queue.length > 1 && ` 残り${state.queue.length}枚`}
            </p>
            <button
              onClick={() => uploadQueue(state.queue, state.total)}
              className="mt-2 text-sm text-theme underline underline-offset-4"
            >
              もう一度送る
            </button>
          </div>
        )}

        {/* capture を付けないことで、端末側で「カメラ / ライブラリ」を選べる */}
        <input
          ref={libraryInputRef}
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
        {/* 写真が必須でないスポットは、写真なしでも次へ進める */}
        {!photoRequired && !isDone && (
          <button
            onClick={completeWithoutPhoto}
            disabled={busy}
            className="button-primary mb-3 w-full"
          >
            {completeLabel}
          </button>
        )}
        {/* 写真の追加はボタン1つに統合。押すとカメラ/フォルダを端末側で選べる */}
        <button
          onClick={() => libraryInputRef.current?.click()}
          disabled={busy}
          className={
            "w-full " +
            (isDone || !photoRequired ? "button-secondary" : "button-primary")
          }
        >
          <Icon name="photo" />
          写真を追加する
        </button>
        {!photoRequired && !isDone && (
          <p className="mt-3 text-center text-xs text-neutral-400">
            写真は撮らなくても進めます
          </p>
        )}
      </div>

      {celebrating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-paper px-8 py-10"
        >
          <div className="w-full max-w-sm text-center">
            <p className="eyebrow mb-7">ONE MORE MEMORY</p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-theme text-theme"
            >
              <Icon name="check" width="32" height="32" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center font-serif text-2xl leading-loose text-ink"
            >
              またひとつ、思い出に。
              <br />
              <span className="font-sans text-sm text-muted">
                ミッションを達成しました。
              </span>
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={() => router.push(`/t/${slug}`)}
              className="button-secondary mt-10 w-full"
            >
              ホームへ戻る
            </motion.button>
            {/* そのまま次へ進みたい時のショートカット */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              onClick={(e) => {
                // 押した瞬間に反応を返す(遷移までの間、無反応に見せない)
                e.currentTarget.style.opacity = "0.6";
                // 直前の達成を反映してから進む(次が2択なら選択画面へ)
                router.refresh();
                router.push(nextHref);
              }}
              className="button-primary mt-3 w-full"
            >
              {nextLabel}
              <Icon name="arrow" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </main>
  );
}
