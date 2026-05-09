import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
};

export function LandingReveal({
  children,
  className,
  delayMs = 0,
}: LandingRevealProps) {
  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-reduce:animate-none",
        className
      )}
      style={{
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
