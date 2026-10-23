import { ImageResponse } from "next/og";

// The Aggie Connect mark (gold "AC" on Aggie Blue) as a full-bleed square PNG,
// for home-screen icons. Same drawing as src/app/icon.svg.
// `inset` shrinks the mark toward the center, for maskable icons where
// Android may crop up to the outer 10% on each side.
export function brandIcon(size: number, inset = 0) {
  const mark = size * (1 - 2 * inset);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#004684",
        }}
      >
        <svg width={mark} height={mark} viewBox="0 0 64 64">
          <g
            fill="none"
            stroke="#FDB927"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 45 L18 17 L28 45" />
            <path d="M12.5 35 H23.5" />
            <path d="M57 23 A 12 12 0 1 0 57 41" />
          </g>
          <rect x="8" y="53" width="48" height="3" rx="1.5" fill="#FDB927" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
