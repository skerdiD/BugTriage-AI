import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function AppLogoMark({ className, iconClassName }: AppLogoMarkProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0f172a] shadow-lg shadow-cyan-500/15",
        className
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_36%),radial-gradient(circle_at_70%_72%,rgba(139,92,246,0.4),transparent_42%)]" />
      <svg
        viewBox="0 0 64 64"
        className={cn("relative size-7", iconClassName)}
        fill="none"
      >
        <circle cx="32" cy="32" r="24" stroke="#38bdf8" strokeOpacity="0.34" strokeWidth="3" />
        <circle cx="32" cy="32" r="14" stroke="#a78bfa" strokeOpacity="0.55" strokeWidth="3" />
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
  );
}
