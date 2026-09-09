// 編集中も下部タブから参加画面に戻れるようにする。
import TabBar from "@/components/TabBar";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
