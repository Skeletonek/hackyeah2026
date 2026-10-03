import Image from "next/image";
import { cn } from "@/lib/utils";

/** „Nothing here yet”: what it means and what to do next, under the parzenica ornament. */
export function EmptyState({
  title,
  action,
  headingLevel: Heading = "h2",
  className,
  children,
}: {
  title: string;
  /** Buttons or links under the text. */
  action?: React.ReactNode;
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      {/* Decorative; the colours are baked into the file, so Kontrast flips it to light on black. */}
      <Image
        src="/motyw/splot-motyw-parzenica.svg"
        alt=""
        width={160}
        height={140}
        unoptimized
        className="h-auto w-28 kontrast:grayscale kontrast:invert simple:hidden"
      />
      <Heading className="text-h3 simple:text-simple-h3">{title}</Heading>
      {children && <div className="max-w-[68ch] text-muted-foreground">{children}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
