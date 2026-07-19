// リトライ付きアップロード(クライアント専用)
// - 弱電波前提: 自動リトライ(指数バックオフ)。全滅したら throw → UI側で手動リトライ
// - 進捗表示のため XMLHttpRequest を使用(fetchはアップロード進捗が取れない)
// - サーバー側(/api/t/[slug]/upload)で photos INSERT / 1枚目なら progress 記録
export type UploadResult = {
  photoId: string;
  signedUrl: string | null;
  completedNow: boolean;
};

const MAX_ATTEMPTS = 3;

export async function uploadPhoto(args: {
  slug: string;
  spotId: string;
  token: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<UploadResult> {
  let lastError: Error = new Error("upload failed");
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
      args.onProgress?.(0);
    }
    try {
      return await uploadOnce(args);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // 認証エラー等はリトライしても無駄なので即座に投げる
      if (lastError.message.startsWith("http:4")) throw lastError;
    }
  }
  throw lastError;
}

function uploadOnce({
  slug,
  spotId,
  token,
  file,
  onProgress,
}: {
  slug: string;
  spotId: string;
  token: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, "photo.jpg");
    form.append("spotId", spotId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/t/${slug}/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 60_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadResult);
      } else {
        reject(new Error(`http:${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send(form);
  });
}
