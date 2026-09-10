// ナビゲーションと操作に使う、線幅を揃えた小さなアイコン。
import type { SVGProps } from "react";

const paths = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  route:
    "M6 5a2 2 0 1 0 0 .01M6 7v7a4 4 0 0 0 4 4h4M18 17a2 2 0 1 0 0 .01M13 5h7m-3-3 3 3-3 3",
  edit: "m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14l-1 7Z",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  plus: "M12 5v14M5 12h14",
  photo: "M3 6h4l2-3h6l2 3h4v15H3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  book: "M12 6v15M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Z",
  check: "m5 12 4 4L19 6",
  lock: "M6 10h12v11H6Zm3 0V6a3 3 0 0 1 6 0v4",
  copy: "M8 8h12v13H8ZM16 8V3H3v14h5",
} as const;

export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
