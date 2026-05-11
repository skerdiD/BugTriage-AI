import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LandingSectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function LandingSectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: LandingSectionIntroProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[0.68rem] font-semibold tracking-[0.24em] text-cyan-100 uppercase">
        {eyebrow}
      </Badge>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-300 md:text-lg">
        {description}
      </p>
    </div>
  );
}
