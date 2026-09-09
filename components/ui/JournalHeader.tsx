// 各画面を一冊の旅の記録としてつなぐ、共通の見出し。
import Link from "next/link";
import Icon from "./Icon";

export function Wordmark() {
  return (
    <span className="wordmark">
      <Icon name="book" />
      <span>ふたりの旅</span>
    </span>
  );
}

export default function JournalHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="journal-header">
      <div className="masthead">
        <Link href="/" aria-label="ふたりの旅・参加一覧へ">
          <Wordmark />
        </Link>
        <span className="edition">A JOURNAL FOR TWO</span>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description && <p className="description">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
