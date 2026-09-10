// 各画面を一冊の旅の記録としてつなぐ、共通の見出し。
import Link from "next/link";

export function Wordmark() {
  return (
    <span className="wordmark">
      <span>ふたりの旅</span>
    </span>
  );
}

export function JournalMasthead() {
  return (
    <div className="masthead">
      <Link href="/" aria-label="ふたりの旅・参加一覧へ">
        <Wordmark />
      </Link>
      <span className="masthead-note">
        ふたりで見つける、
        <br />
        特別な一日。
      </span>
    </div>
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
      <JournalMasthead />
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
