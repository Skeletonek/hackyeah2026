import type { MatchmakingContext } from "./skill";

/** A ready problem description on the `/match` entry screen; a click fills the field. */
export type MatchExample = {
  /** Short button text. */
  label: string;
  /** What lands in the field. */
  text: string;
};

export const MATCH_EXAMPLES: Record<MatchmakingContext["role"], MatchExample[]> = {
  resident: [
    {
      label: "Sąsiadka mieszka sama i rzadko wychodzi z domu",
      text: "Moja sąsiadka ma ponad 80 lat i mieszka sama. Rzadko wychodzi z domu i prawie nikt jej nie odwiedza. Szukam sposobu, żeby miała z kim porozmawiać.",
    },
    {
      label: "Starsze osoby nie umieją załatwić spraw przez internet",
      text: "W naszej wsi starsze osoby nie umieją umówić wizyty u lekarza ani załatwić sprawy w urzędzie przez internet. Nie ma kto im tego pokazać.",
    },
    {
      label: "Młodzież nie ma gdzie porozmawiać o swoich kłopotach",
      text: "Młodzież w naszej miejscowości nie ma gdzie porozmawiać o swoich kłopotach. Do psychologa trzeba jechać 40 km i czekać kilka miesięcy.",
    },
  ],
  municipality: [
    {
      label: "Seniorzy z odległych wsi nie mają dojazdu do lekarza",
      text: "W naszej gminie seniorzy z odległych wsi nie mają jak dojechać do lekarza ani do klubu seniora. Autobus kursuje 2 razy dziennie.",
    },
    {
      label: "Opiekunowie osób zależnych nie mają wytchnienia",
      text: "Mieszkańcy, którzy opiekują się w domu chorymi bliskimi, nie mają żadnego wsparcia ani czasu na odpoczynek. Szukamy usługi, którą gmina może uruchomić.",
    },
    {
      label: "Instytucje pomagają tym samym osobom i nie wiedzą o sobie",
      text: "Ośrodek pomocy społecznej, przychodnia i organizacje pomagają tym samym osobom, ale nie wymieniają się informacjami. Szukamy sposobu na lepszą współpracę.",
    },
  ],
};
