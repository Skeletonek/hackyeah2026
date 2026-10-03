import {
  Armchair,
  Brain,
  DoorOpen,
  MapPinMinus,
  Network,
  UserRound,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { CHALLENGE_CATEGORY_LABELS, type ChallengeCategory } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Icons from splot-design/ikony; colours are the `cat-*` token pairs. */
const CATEGORIES: Record<ChallengeCategory, { icon: LucideIcon; className: string }> = {
  aging: { icon: Armchair, className: "bg-cat-starzenie-soft text-cat-starzenie" },
  mental_health: { icon: Brain, className: "bg-cat-zdrowie-soft text-cat-zdrowie" },
  loneliness: { icon: UserRound, className: "bg-cat-samotnosc-soft text-cat-samotnosc" },
  digital_exclusion: { icon: WifiOff, className: "bg-cat-cyfrowe-soft text-cat-cyfrowe" },
  service_access: { icon: DoorOpen, className: "bg-cat-uslugi-soft text-cat-uslugi" },
  coordination: { icon: Network, className: "bg-cat-koordynacja-soft text-cat-koordynacja" },
  depopulation: { icon: MapPinMinus, className: "bg-cat-depopulacja-soft text-cat-depopulacja" },
};

/** Challenge category as icon + name, so colour is never the only carrier. */
export function CategoryBadge({
  category,
  className,
}: {
  category: ChallengeCategory;
  className?: string;
}) {
  const { icon: Icon, className: categoryClassName } = CATEGORIES[category];

  return (
    <span
      data-slot="category-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-transparent px-3 py-1 text-sm font-bold kontrast:border-current simple:px-4 simple:py-1.5 simple:text-simple-sm",
        categoryClassName,
        className,
      )}
    >
      <Icon aria-hidden className="size-5 shrink-0 simple:size-6" strokeWidth={2} />
      {CHALLENGE_CATEGORY_LABELS[category]}
    </span>
  );
}
