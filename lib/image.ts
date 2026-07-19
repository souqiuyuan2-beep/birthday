// 画像の前処理(クライアント専用)
// - browser-image-compression で圧縮(長辺1600px / 約500KB目安)
// - Canvas経由で再エンコードされるためEXIF(位置情報含む)は除去される
import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.5,
    fileType: "image/jpeg",
    initialQuality: 0.85,
    useWebWorker: true,
  });
}
