import { ExternalLink } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/library/innovation";
import { cn } from "@/lib/utils";

/**
 * The innovation's film: a YouTube embed with Polish captions on (when the
 * author added them), always with a text link for anyone who cannot use the player.
 */
export function InnovationVideo({
  videoUrl,
  title,
  className,
}: {
  videoUrl: string;
  title: string;
  className?: string;
}) {
  const embedUrl = youtubeEmbedUrl(videoUrl);

  return (
    <section aria-labelledby="video-heading" className={cn("flex flex-col gap-3", className)}>
      <h2 id="video-heading" className="text-h2 simple:text-simple-h2">
        Film
      </h2>
      {embedUrl && (
        <div className="aspect-video overflow-hidden rounded-lg bg-sidebar">
          <iframe
            src={embedUrl}
            title={`Film: ${title}`}
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full border-0"
          />
        </div>
      )}
      <p className="text-muted-foreground">
        {embedUrl && "Napisy włączają się same, jeśli autor filmu je dodał. "}
        <a
          href={videoUrl}
          className="inline-flex min-h-11 items-center gap-1 font-bold text-primary underline underline-offset-[0.2em] hover:decoration-[3px]"
        >
          {embedUrl ? "Obejrzyj na YouTube" : "Obejrzyj film"}
          <ExternalLink aria-hidden className="size-5 shrink-0" strokeWidth={2} />
        </a>
      </p>
    </section>
  );
}
