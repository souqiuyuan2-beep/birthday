// 白い縁のプリントを重ねたアルバムの表紙。写真は装飾画像か認可済みの署名付きURLだけ。
// 写真が1枚のときは1枚で表示し、実際の思い出とイメージ写真を混ぜない。
type CoverPhoto = { url: string; alt: string };

export default function FilmCover({
  photos = [],
  date,
  caption,
}: {
  photos?: CoverPhoto[];
  date?: string | null;
  caption?: string;
}) {
  const hasMemories = photos.length > 0;
  const main = photos[0] ?? {
    url: "/images/coastal-film.jpg",
    alt: "旅のイメージ：穏やかな海辺の街",
  };
  const small = hasMemories
    ? photos[1]
    : { url: "/images/train-window.jpg", alt: "旅のイメージ：車窓に広がる海" };

  return (
    <div className="film-cover" data-pair={!!small}>
      <div className="film-cover-pictures">
        <div className="film-print film-cover-main">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main.url}
            alt={main.alt}
            width="1200"
            height="800"
            fetchPriority="high"
          />
        </div>
        {small && (
          <div className="film-print film-cover-small">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={small.url} alt={small.alt} width="400" height="400" />
          </div>
        )}
      </div>
      <div className="film-cover-caption">
        <span>
          {date && (
            <time dateTime={date}>{date.slice(5).replace("-", ".")}</time>
          )}
          <span>
            {caption ?? (hasMemories ? "ふたりの思い出" : "旅のはじまり")}
          </span>
        </span>
        <span className="film-cover-note" aria-hidden="true">
          Good trip,
          <br />
          together.
        </span>
      </div>
    </div>
  );
}
