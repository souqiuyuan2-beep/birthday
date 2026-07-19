// 旧・個別ロック画面のURL。合言葉入力はトップページ(/)に一本化したため、
// 古いリンクで来てもトップへ送る
import { redirect } from "next/navigation";

export default function LockPage() {
  redirect("/");
}
