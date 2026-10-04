import type { MatchmakingContext } from "./skill";

/** A ready problem description on the `/match` entry screen; a click fills the field. */
export type MatchExample = {
  /** Short button text. */
  label: string;
  /** What lands in the field. */
  text: string;
};

/** What differs between `/match` (resident) and `/municipalities` (municipality official). */
export type MatchCopy = {
  /** Page title and heading. */
  title: string;
  intro: string;
  /** Label and hint of the problem field. */
  fieldLabel: string;
  fieldHint: string;
  examples: MatchExample[];
};

export const MATCH_COPY: Record<MatchmakingContext["role"], MatchCopy> = {
  resident: {
    title: "Mam problem",
    intro: "Opisz, co jest trudne. Poszukamy sprawdzonych rozwiązań z Małopolski.",
    fieldLabel: "Opisz własnymi słowami, co jest problemem",
    fieldHint: "Wystarczą 2–3 zdania. Nie podawaj nazwisk, adresów ani numerów telefonu.",
    examples: [
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
  },
  municipality: {
    title: "Szukam rozwiązania dla gminy",
    intro:
      "Opisz problem mieszkańców swojej gminy. Poszukamy sprawdzonych rozwiązań, które samorząd może wdrożyć u siebie.",
    fieldLabel: "Opisz, z jakim problemem mierzy się gmina",
    fieldHint: "Wystarczą 2–3 zdania: kogo dotyczy problem i co jest trudne. Nie podawaj danych mieszkańców.",
    examples: [
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
  },
};
