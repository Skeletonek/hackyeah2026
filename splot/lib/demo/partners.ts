/**
 * Static, fictional demo data for the C6 preview screens.
 *
 * These records are placeholders only — no real people or organisations.
 * They are used by `/account/partners` and `/account/consultations` while
 * module V (partnership board + expert consultations) is still in design.
 */

export type PartnerMatch = {
  id: string;
  name: string;
  /** Organisation profile type, for labels and badges. */
  type: "ngo" | "municipality" | "community_group" | "other";
  county: string;
  /** 0–100 AI-style match score, displayed as a percentage. */
  match: number;
  /** Why the system thinks this partner fits. */
  matchReason: string;
  /** Social-challenge tags. */
  areas: string[];
  /** Short bio of the fictional partner. */
  description: string;
};

export type ExpertSlot = {
  id: string;
  /** Fictional display name. */
  name: string;
  role: string;
  /** Challenge areas the expert advises on. */
  specialization: string[];
  /** Next available fictional slots, already formatted for display. */
  nextSlots: string[];
  /** Short bio of the fictional expert. */
  description: string;
};

const ORGANIZATION_TYPE_LABELS: Record<PartnerMatch["type"], string> = {
  ngo: "Organizacja pozarządowa",
  municipality: "Samorząd",
  community_group: "Grupa nieformalna",
  other: "Inny podmiot",
};

export function partnerTypeLabel(type: PartnerMatch["type"]): string {
  return ORGANIZATION_TYPE_LABELS[type];
}

/** Fictional partner matches for KOM4 „Szukam partnera”. */
export const PARTNER_MATCHES: PartnerMatch[] = [
  {
    id: "demo-partner-krakow",
    name: "Stowarzyszenie „Wspólna Przyszłość”",
    type: "ngo",
    county: "powiat krakowski",
    match: 94,
    matchReason: "Prowadzi warsztaty cyfrowe dla seniorów i szuka gmin do pilotażu.",
    areas: ["Wykluczenie cyfrowe", "Starzenie się"],
    description:
      "Lokalna organizacja z ośmioletnim doświadczeniem w nauce obsługi urządzeń mobilnych dla osób 60+. Szuka partnera, który dostarczy lokalną salę i pomoże dotrzeć do seniorów na wsi.",
  },
  {
    id: "demo-partner-nowosadecki",
    name: "Gmina Łącko — Departament Polityki Społecznej",
    type: "municipality",
    county: "powiat nowosądecki",
    match: 89,
    matchReason: "Diagnozowała samotność wśród mieszkańców 65+ i planuje program sąsiedzki.",
    areas: ["Samotność", "Koordynacja"],
    description:
      "Jednostka samorządowa prowadząca ankietę potrzeb seniorów. Szuka organizacji, która wdroży warsztaty integracyjne i szkolenie dla liderów lokalnych.",
  },
  {
    id: "demo-partner-tatrzanski",
    name: "Grupa Nieformalna „Sąsiedzi Gór”",
    type: "community_group",
    county: "powiat tatrzański",
    match: 86,
    matchReason: "Działa na rzecz dostępu do usług społecznych w górskich miejscowościach.",
    areas: ["Dostęp do usług", "Depopulacja"],
    description:
      "Inicjatywa mieszkańców gmin podtatrzańskich. Organizuje wspólne dojazdy do placówek zdrowia i urzędów, szuka partnera do cyfrowej koordynacji transportu.",
  },
  {
    id: "demo-partner-wadowicki",
    name: "Fundacja „Młodzi dla Regionu”",
    type: "ngo",
    county: "powiat wadowicki",
    match: 82,
    matchReason: "Wspiera młodzież NEET i chce połączyć działania ze wsparciem dla seniorów.",
    areas: ["Rynek pracy", "Starzenie się"],
    description:
      "Fundacja prowadzi mentoring dla osób wchodzących na rynek pracy. Szuka międzypokoleniowego partnera, który połączy młodych doradców z potrzebującymi wsparcia seniorami.",
  },
];

/** Fictional consultation slots for KOM5 „Konsultacje”. */
export const EXPERT_SLOTS: ExpertSlot[] = [
  {
    id: "demo-expert-kowalska",
    name: "dr Anna Kowalska",
    role: "Ekspertka ds. innowacji społecznych",
    specialization: ["Starzenie się", "Samotność"],
    nextSlots: ["8 października, 10:00", "10 października, 14:00"],
    description:
      "Pomaga organizacjom i jednostkom samorządowym projektować usługi skierowane do osób starszych oraz programy przeciwdziałające samotności.",
  },
  {
    id: "demo-expert-nowak",
    name: "Tomasz Nowak",
    role: "Specjalista ds. ekonomii społecznej",
    specialization: ["Rynek pracy", "Koordynacja"],
    nextSlots: ["9 października, 11:00", "11 października, 9:00"],
    description:
      "Doradza podmiotom ekonomii społecznej w zakresie modeli biznesowych, pozyskiwania zespołów i współpracy międzysektorowej.",
  },
  {
    id: "demo-expert-wisniewska",
    name: "Magdalena Wiśniewska",
    role: "Ekspertka ds. wykluczenia cyfrowego",
    specialization: ["Wykluczenie cyfrowe", "Dostęp do usług"],
    nextSlots: ["7 października, 15:00", "12 października, 10:00"],
    description:
      "Projektuje szkolenia i materiały dla osób z niskim poziomem kompetencji cyfrowych, współpracując z bibliotekami i ośrodkami pomocy społecznej.",
  },
];
