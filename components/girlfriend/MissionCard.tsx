// G4+G5のクライアント部分: ミッションカード+撮影・アップロードUI
// - カメラ起動 or フォルダから複数枚選択 → 圧縮(EXIF除去) → 1枚ずつリトライ付きアップロード
// - 失敗時は残りのキューを保持して手動リトライ(途中から再開)
// - 写真は×ボタンで削除可(達成状態は維持=撮り直しできる)
"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getTripToken } from "@/lib/auth-client";
import { compressImage } from "@/lib/image";
import { uploadPhoto } from "@/lib/upload";
import Confetti from "@/components/girlfriend/Confetti";

type PhotoItem = { id: string; url: string };

type Props = {
  spotId: string;
  displayName: string;
  mission: string;
  hint: string | null;
  message: string | null;
  done: boolean;
  initialPhotos: PhotoItem[];
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
}: Props) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    const token = getTripToken(slug);
    if (!token) {
      router.replace("/");
      return;
    }
    let completedNow = false;
    for (let i = 0; i < queue.length; i++) {
      const index = total - queue.length + i + 1;
      setState({ phase: "uploading", percent: 0, index, total });
      try {
        const result = await uploadPhoto({
          slug,
          spotId,
          token,
          file: queue[i],
          onProgress: (percent) =>
            setState({ phase: "uploading", percent, index, total }),
        });
        if (result.signedUrl) {
          setPhotos((list) => [...list, { id: result.photoId, url: result.signedUrl! }]);
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

  async function deletePhoto(photo: PhotoItem) {
    const warn =
      photos.length === 1
        ? "これが最後の1枚だよ。削除するとこのスポットの写真が0枚になるけど、本当に削除する?"
        : "この写真を削除する?";
    if (!confirm(warn)) return;
    const token = getTripToken(slug);
    if (!token) return;
    const res = await fetch(`/api/t/${slug}/photos/${photo.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      router.refresh();
    }
  }

  const busy = state.phase === "compressing" || state.phase === "uploading";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <button
        onClick={() => router.push(`/t/${slug}`)}
        className="mb-6 self-start text-sm text-neutral-400"
      >
        ← 戻る
      </button>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h1 className="font-serif text-xl font-semibold tracking-wide">
          {displayName}
        </h1>
        <p className="mt-4 leading-relaxed text-neutral-700">{mission}</p>

        {hint && (
          <div className="mt-4">
            <button
              onClick={() => setShowHint((v) => !v)}
              className="text-sm text-theme underline underline-offset-4"
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
          <p className="mt-5 border-t border-neutral-100 pt-4 font-serif text-sm leading-relaxed text-neutral-500">
            {message}
          </p>
        )}
      </motion.section>

      {photos.length > 0 && (
        <div className="mt-6 flex gap-3 overflow-x-auto p-2">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`撮った写真 ${i + 1}`}
                className="h-28 w-28 rounded-xl object-cover shadow-sm"
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

        {/* カメラ起動用(capture付き・1枚)とフォルダ選択用(複数枚可)で入力を分ける */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            void handleFiles(files);
            e.target.value = "";
          }}
        />
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
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {isDone ? "写真を撮って追加する" : "写真を撮る"}
        </button>
        <button
          onClick={() => libraryInputRef.current?.click()}
          disabled={busy}
          className="mt-3 w-full rounded-2xl border-2 border-theme bg-white py-3.5 text-base font-medium text-theme-deep transition-all active:scale-[0.98] disabled:opacity-40"
        >
          フォルダから選ぶ
        </button>
      </div>

      {celebrating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 px-8 backdrop-blur-sm"
        >
          <Confetti count={44} />
          <div className="relative">
            {/* スタンプがドンと押される */}
            <motion.div
              initial={{ scale: 2.6, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
              className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-theme bg-white shadow-lg"
            >
              <span className="font-serif text-2xl font-bold tracking-widest text-theme-deep">
                達成!
              </span>
            </motion.div>
            {/* まわりのきらめき */}
            {[
              { top: "-14px", left: "-6px", delay: "0.3s" },
              { top: "6px", right: "-18px", delay: "0.6s" },
              { bottom: "-10px", left: "10px", delay: "0.9s" },
            ].map((pos, i) => (
              <span
                key={i}
                aria-hidden
                className="absolute text-xl text-gold"
                style={{
                  ...pos,
                  animation: `twinkle 1.6s ease-in-out ${pos.delay} infinite`,
                }}
              >
                ✦
              </span>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-9 text-center text-sm leading-relaxed text-neutral-600"
          >
            ミッションクリア!
            <br />
            次の場所へ進もう
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={() => router.push(`/t/${slug}`)}
            className="mt-10 w-full rounded-2xl bg-theme py-4 text-base font-medium text-white shadow-md transition-transform active:scale-[0.98]"
          >
            ホームへ戻る
          </motion.button>
        </motion.div>
      )}
    </main>
  );
}
