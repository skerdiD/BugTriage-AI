import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0f172a",
          borderRadius: "16px",
          display: "flex",
          height: "64px",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: "64px",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(56,189,248,0.42), transparent 38%), radial-gradient(circle at 72% 74%, rgba(139,92,246,0.48), transparent 44%)",
            display: "flex",
            inset: 0,
            position: "absolute",
          }}
        />
        <svg
          width="52"
          height="52"
          viewBox="0 0 64 64"
          fill="none"
          style={{ position: "relative" }}
        >
          <circle cx="32" cy="32" r="24" stroke="#38bdf8" strokeOpacity="0.36" strokeWidth="3" />
          <circle cx="32" cy="32" r="14" stroke="#a78bfa" strokeOpacity="0.62" strokeWidth="3" />
          <path
            d="M14 32h9M41 32h9M32 14v8M32 42v8"
            stroke="#67e8f9"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M25 28c0-5 3-9 7-9s7 4 7 9v9c0 5-3 8-7 8s-7-3-7-8v-9Z"
            fill="#0f172a"
            stroke="#f8fafc"
            strokeWidth="3"
          />
          <path
            d="M23 30h-5M41 30h5M23 38h-5M41 38h5M27 22l-5-5M37 22l5-5"
            stroke="#f8fafc"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M32 21v24M26 33h12"
            stroke="#8b5cf6"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </div>
    ),
    size
  );
}
