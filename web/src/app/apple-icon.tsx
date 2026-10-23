import { ImageResponse } from "next/og";

// Home-screen icon for iPhones and iPads. Same mark as src/app/icon.svg,
// full-bleed because iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#004684",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
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
    { ...size },
  );
}
