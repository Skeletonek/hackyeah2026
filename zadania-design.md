# Zadania: projekt graficzny (HubMI.pl)

Terminy liczone od startu konkursu: **sob 11:00**. Deadline zgłoszenia: **nd 11:00**.
Nazwa platformy jest jeszcze otwarta (propozycje: Zaczyn / Splot / Łącznik). Blokuje logo, więc ustalcie ją od razu.

| #   | Task                                         | Moduły z wyzwania             | Priorytet | Termin    |
| --- | -------------------------------------------- | ----------------------------- | --------- | --------- |
| 1   | Identyfikacja wizualna i design system       | (wszystkie)                   | P0        | sob 19:00 |
| 2   | Szkielet aplikacji i strona główna           | (wszystkie)                   | P0        | sob 17:00 |
| 3   | Matchmaking społeczny                        | I                             | P0        | sob 22:00 |
| 4   | Panel administratora                         | VI, II (trendy)               | P0/P1     | nd 0:30   |
| 5   | Biblioteka wiedzy i Tester innowacji         | II, IV                        | P1        | nd 2:30   |
| 6   | Kreator pomysłów i generator wniosków        | III                           | P1/P2     | nd 4:00   |
| 7   | Komunikacja i status zgłoszeń                | V                             | P1/P2     | nd 5:00   |
| 8   | Middleman Innowacji                          | VII                           | P2        | nd 6:00   |
| 9   | Klikalny prototyp i eksporty do zgłoszenia   | -                             | P0        | nd 7:00   |

Za każdy moduł jest punktacja (matchmaking 10%, każdy kolejny +5%), więc **każdy z 7 modułów musi mieć co najmniej 1 ekran**.

---

## Task 1: Identyfikacja wizualna i design system (zgodny z WCAG 2.1 AA)

**Cel:** Zbudować spójny język wizualny platformy, z którego developerzy od razu zbudują UI, i z którego powstaną slajdy oraz film.

**Dlaczego to ważne:**

- 20% oceny to dostępność i intuicyjność (WCAG 2.1 AA, seniorzy, osoby o niskich kompetencjach cyfrowych);
- 10% to atrakcyjność, pomysłowość i jakość interfejsu, a jury nagradza podejście nieszablonowe;
- 10% to jakość materiałów (PDF, film).

**Zakres:**

- **Logo i znak** dla nazwy platformy. Wersja pozioma i sygnet, oba warianty do użycia na jasnym i ciemnym tle.
- **Motyw graficzny** jako nośnik idei łączenia: problem → rozwiązanie, ludzie → instytucje. Na przykład nici lub węzły łączące punkty, z delikatnym nawiązaniem do Małopolski. Motyw musi być dekoracyjny i nie może nieść informacji.
- **Paleta kolorów:**
  - kolor główny, akcent, neutralne;
  - kolory semantyczne: sukces, ostrzeżenie, błąd, info;
  - kolor dla każdej kategorii wyzwań z Mapy Wyzwań: starzenie, zdrowie psychiczne, samotność, wykluczenie cyfrowe, dostęp do usług, koordynacja, depopulacja.
- **Typografia:** font z pełnym wsparciem polskich znaków (np. z Google Fonts), skala nagłówków i tekstu.
- **Komponenty bazowe** (zmapowane na shadcn/ui, żeby dev wiedział, czego użyć):
  - przycisk, w tym duży wariant CTA;
  - pole tekstowe z przyciskiem mikrofonu, textarea, select, checkbox i radio;
  - karta innowacji, badge kategorii, tag;
  - alert/toast, stepper (wizard 4 kroki);
  - timeline statusu („śledzenie paczki”), dymek czatu;
  - stan „AI myśli” (streaming), stan pusty.
- **Tryb „Prościej”:** większa skala typografii, mniej elementów na ekranie, wysoki kontrast.
- **Szablon slajdów 16:9** (PDF, max 10 slajdów) i plansze do filmu: intro, outro, belki z napisami.

**Wymagania dostępności (obowiązkowe):**

- Kontrast tekstu ≥ 4.5:1. Tekst duży (≥ 24 px albo ≥ 18,66 px bold) oraz elementy UI, ikony i obramowania pól ≥ 3:1 (1.4.3, 1.4.11). Każdą parę kolorów trzeba sprawdzić i wypisać w tabeli.
- Kolor nigdy nie jest jedynym nośnikiem informacji, więc kategorie i statusy mają też ikonę lub etykietę (1.4.1).
- Bazowy rozmiar tekstu 18 px (minimum 16 px), interlinia ≥ 1.5.
- Wyraźny focus ring (≥ 2 px, kontrast ≥ 3:1) zaprojektowany dla każdego komponentu interaktywnego.
- Cele klikalne min. 44×44 px (dobra praktyka dla seniorów).
- Komponenty działają przy powiększeniu tekstu do 200% i przy szerokości 320 px (1.4.4, 1.4.10).
- Stany każdego komponentu: default, hover, focus, active, disabled, error.

**Deliverables:**

- [ ] Plik Figma: strona _Foundations_ (kolory, typografia, spacing, radius, cienie, ikony) i strona _Components_
- [ ] Tokeny wyeksportowane jako zmienne CSS / config Tailwind (`--primary`, `--background` itd., zgodne z konwencją shadcn)
- [ ] Tabela kontrastów z wynikami (WebAIM Contrast Checker lub plugin Stark)
- [ ] Logo w SVG i PNG, favicon
- [ ] Szablon slajdów i plansze do filmu

**Definition of Done:**

- Developer może przenieść tokeny do kodu bez dopytywania.
- Wszystkie pary kolorów spełniają AA.
- Każdy komponent ma zaprojektowany stan focus.

**Termin:** tokeny i paleta do **sob 15:00** (blokują frontend), reszta do **sob 19:00**.

---

## Zasady wspólne dla Tasków 2–8 (ekrany aplikacji)

**Persony (każdy kluczowy ekran zweryfikować pod ich kątem):**

1. **Senior / mieszkaniec:** niskie kompetencje cyfrowe, chce opisać problem własnymi słowami.
2. **NGO / innowator:** ma pomysł i chce go zgłosić oraz zdobyć finansowanie.
3. **Urzędnik JST:** szuka gotowych rozwiązań, które da się wdrożyć w gminie.
4. **Ekspert:** szybko udziela feedbacku.
5. **Admin ROPS:** obsługuje zgłoszenia, aktualizuje wiedzę, śledzi trendy.

**Reguły:**

- Używać wyłącznie komponentów z Task 1. Nowy komponent trzeba najpierw dodać do biblioteki.
- Domyślnie desktop 1440 px. Mobile 360 px tylko tam, gdzie task tak mówi.
- Dla kluczowych ekranów zaprojektować stany: ładowanie / AI w trakcie, błąd, pusty, sukces.
- Prosty język bez żargonu, np. „Opisz problem” zamiast „Zgłoś need”. Wszystkie teksty po polsku.
- Etykiety pól zawsze widoczne (sam placeholder nie wystarcza), błędy opisane tekstem przy polu.
- **Bez prawdziwych danych osobowych.** Osoby fikcyjne, gminy i powiaty mogą być prawdziwe.
- Do czasu oddania Task 1 można pracować na wireframe'ach, a potem nałożyć na nie styl.

---

## Task 2: Szkielet aplikacji i strona główna

**Cel:** Wspólna rama dla wszystkich ekranów, żeby kolejne taski tylko wypełniały treść. Strona główna ma od pierwszego wejrzenia kierować każdą personę we właściwe miejsce.

**Ekrany:**

- [ ] **Layout użytkownika (desktop + mobile):**
  - header z logo i nawigacją;
  - przełączniki „Prościej”, „Kontrast” i „A+”;
  - konto lub logowanie;
  - stopka;
  - skip link „Przejdź do treści”.
- [ ] **Layout admina:** boczna nawigacja (Zgłoszenia, Biblioteka, Nabory, Trendy, Wiadomości), licznik nowych zgłoszeń
- [ ] **Strona główna (desktop + mobile):**
  - 3 duże wejścia: „Mam problem” / „Mam pomysł” / „Szukam rozwiązania dla gminy”;
  - wyszukiwarka;
  - pasek „Trwa nabór” (gdy jest aktywny);
  - 3 polecane innowacje.
- [ ] **Logowanie:** magic link, czyli wpisz e-mail i kliknij link w mailu (bez hasła); informacja, że zgłoszenie da się złożyć bez konta
- [ ] **Mapa ścieżek** (strona _Flows_ w Figmie): schemat, jak persony przechodzą między modułami

**Definition of Done:** Layouty są gotowe do użycia jako ramka w pozostałych taskach, a strona główna istnieje w wersji mobile i desktop.

**Termin:** wireframe do **sob 14:00**, ostylowane do **sob 17:00**.

---

## Task 3: Matchmaking społeczny (moduł I, obowiązkowy)

**Cel:** Najważniejsza ścieżka w całym projekcie, za którą jest 10% oceny. Jury sprawdza w niej: łatwość zgłoszenia problemu, trafność propozycji i to, czy osoba nietechniczna przejdzie ją sama.

**Ekrany (desktop + mobile):**

- [ ] **Wejście:**
  - jedno pole „Opisz własnymi słowami, co jest problemem”;
  - duży przycisk mikrofonu;
  - 3 przykładowe opisy do kliknięcia.
- [ ] **Stan nagrywania głosu:** wyraźny wskaźnik, że system słucha; przycisk „Zakończ”
- [ ] **Dopytanie AI:** jedno pytanie z gotowymi odpowiedziami w formie dużych przycisków plus opcja „Pomiń”
- [ ] **Stan „szukam rozwiązań”:** postęp opisany słowami („Przeglądam 200 innowacji…”), nie sam spinner
- [ ] **Wyniki:**
  - top 5 innowacji, a przy każdej sekcja „Dlaczego to pasuje” z cytatem ze źródła;
  - 👍/👎 przy każdym wyniku;
  - sekcja „Podobne zgłoszenia z innych gmin” z CTA „Połącz się” (wejście do partnerstwa);
  - karta eksperta z CTA „Zapytaj eksperta”;
  - „Zapisz wyniki” / „Wyślij mi na e-mail”.
- [ ] **Brak dopasowania:** „Nie znaleźliśmy gotowego rozwiązania. To może być luka.” Do wyboru: „Zgłoś jako wyzwanie” albo „Zaproponuj pomysł” (przejście do Kreatora)
- [ ] **Potwierdzenie zgłoszenia potrzeby:** numer zgłoszenia i link do śledzenia statusu (Task 7)

**Wymagania specyficzne:**

- **Kolejność fokusu** zaznaczona numerkami na makiecie wejścia i wyników.
- Ekran wyników także w **trybie „Prościej”**: mniej informacji, większe karty, przycisk „Przeczytaj na głos”.
- Wynik AI wyraźnie oznaczony jako podpowiedź, z możliwością zgłoszenia błędu.

**Definition of Done:** Wszystkie ekrany są gotowe w dwóch rozdzielczościach, mają zaznaczony focus order i istnieje wariant w trybie „Prościej”.

**Termin:** **sob 22:00**

---

## Task 4: Panel administratora (moduł VI + trendy z modułu II)

**Cel:** Pokazać jury, jak ROPS szybko obsługuje zgłoszenia i aktualizuje wiedzę. W kryteriach jest pytanie: „jak system powiadamia administratora o nowym pomyśle i jak wygląda ścieżka odpowiedzi do autora”.

**Ekrany:**

- [ ] **P0, inbox zgłoszeń:**
  - lista z kategorią, priorytetem i flagą „możliwy duplikat” nadanymi przez AI, filtry;
  - po prawej podgląd zgłoszenia ze szkicem odpowiedzi od AI;
  - przyciski „Edytuj i wyślij”, „Przypisz eksperta”, „Zmień status”.
- [ ] **P0, powiadomienie o nowym zgłoszeniu:** toast w panelu + mail do admina (prosta makieta maila)
- [ ] **P1, dashboard trendów:**
  - heatmapa potrzeb wg kategorii i czasu;
  - top powiaty;
  - podsumowanie tygodnia od AI;
  - wykresy z opisem tekstowym (dostępność).
- [ ] **P2, edycja karty innowacji:** wklej PDF lub link → AI wypełnia pola → admin poprawia i zatwierdza (widoczne, które pola wypełniło AI)
- [ ] **P2, konfigurator naboru:** nazwa, daty, pola wniosku, kryteria oceny

**Definition of Done:** Inbox i powiadomienie są gotowe. Trendy mają co najmniej 1 ekran.

**Termin:** P0 do **nd 0:00**, reszta do **nd 0:30**. Jeśli brakuje czasu, edycję i konfigurator przenieście na koniec.

---

## Task 5: Biblioteka wiedzy i Tester innowacji (moduły II + IV)

**Cel:** Ciekawa, ale dostępna prezentacja około 200 innowacji ROPS, raportów i Mapy Wyzwań. Wyzwanie mówi wprost: „interesuje nas ciekawa, pomysłowa forma prezentacji”. Tester jest wpięty bezpośrednio w kartę innowacji.

**Ekrany:**

- [ ] **Lista innowacji:** filtry (kategoria, grupa docelowa, etap), widok kart, wyszukiwarka
- [ ] **Karta innowacji:**
  - wideo z napisami;
  - przełącznik „Wersja łatwa do czytania”;
  - przycisk „Przeczytaj na głos”;
  - „Gdzie już działa”;
  - kontakt do autora.
- [ ] **Tester, na karcie innowacji:**
  - CTA „Chcę testować”;
  - średnia ocena i opinie;
  - przycisk „Zaproponuj usprawnienie”.
- [ ] **Tester, formularz:** zgłoszenie do testów (krótko), a po teście ocena w skali 1–5 z opisami słownymi, feedback i propozycja usprawnienia
- [ ] **Mapa Wyzwań:**
  - choropleth powiatów z legendą, w której są ikony, nie tylko kolory;
  - po kliknięciu powiatu: najważniejsze wyzwania i dane z raportów;
  - **widok listy jako alternatywa dla mapy**.
- [ ] **Materiały edukacyjne:** lista materiałów (PDF, wideo, kanwy) + „Zapytaj raporty”, czyli pytanie do AI z odpowiedzią i przypisami do źródeł

**Definition of Done:** Gotowe są karta innowacji z blokiem Testera i Mapa Wyzwań z alternatywą tekstową.

**Termin:** **nd 2:30**

---

## Task 6: Kreator pomysłów i generator wniosków (moduł III)

**Cel:** Prowadzić innowatora od luźnego pomysłu do wniosku w naborze, krok po kroku, z pomocą asystenta AI.

**Ekrany:**

- [ ] **P1, fiszka pomysłu (wizard w 4 krokach):**
  - kroki: Na czym polega pomysł → Dla kogo → Na jakim etapie → Podsumowanie;
  - stepper ze znanym postępem („Krok 2 z 4”);
  - zapis szkicu.
- [ ] **P1, panel asystenta AI obok wizarda:**
  - dopytuje według Kanwy Innowacji Społecznych;
  - podsuwa nietuzinkowe warianty;
  - przycisk „Pokaż, jak to może wyglądać” (wygenerowana wizualizacja).
- [ ] **P1, kanwa innowacji:** widok kanwy wypełnianej na podstawie fiszki, z możliwością edycji i pobrania
- [ ] **P2, generator wniosku:**
  - baner „Trwa nabór X — do DD.MM”;
  - formularz wstępnie wypełniony z fiszki, z oznaczeniem pól uzupełnionych przez AI;
  - checklista kryteriów naboru;
  - poza naborem: stan „Brak aktywnego naboru — powiadom mnie”.

**Definition of Done:** Wizard fiszki jest kompletny razem z asystentem. Generator wniosku ma co najmniej 1 ekran.

**Termin:** **nd 4:00**

---

## Task 7: Komunikacja i status zgłoszeń (moduł V)

**Cel:** Pokazać szybki, przejrzysty dialog między użytkownikiem, ROPS i ekspertami oraz budowanie partnerstw.

**Ekrany:**

- [ ] **P1, tracker statusu („Gdzie jest mój pomysł”):**
  - timeline: przyjęty → w ocenie → odpowiedź / przekazany do eksperta;
  - pod spodem wątek z ROPS.
- [ ] **P1, wątek / czat:** rozmowa z ROPS lub mentorem, załączniki, informacja o czasie odpowiedzi
- [ ] **P2, skrzynka wiadomości:** lista wszystkich wątków użytkownika
- [ ] **P2, tablica „Szukam partnera”:** ogłoszenia z dopasowaniami od AI („Ta organizacja szuka podobnego partnera”)
- [ ] **P2, umówienie konsultacji z ekspertem:** wybór terminu
- [ ] **Makieta maila:** powiadomienie „Masz odpowiedź w sprawie zgłoszenia #123”

**Definition of Done:** Gotowe są tracker statusu i wątek. Tablica partnerstw ma co najmniej 1 ekran.

**Termin:** **nd 5:00**

---

## Task 8: Middleman Innowacji (moduł VII)

**Cel:** Urzędnik JST wybiera innowację, a AI przerabia ją na gotową usługę dopasowaną do jego gminy.

**Ekrany:**

- [ ] **Formularz kontekstu gminy:** typ gminy, liczba mieszkańców, budżet (przedziały), dostępna kadra, partnerzy; maksymalnie 5 pól
- [ ] **Karta usługi (wynik):**
  - opis usługi;
  - kroki wdrożenia (timeline);
  - potrzebne zasoby;
  - szacunkowy koszt;
  - ryzyka;
  - wskaźniki sukcesu.
- [ ] **Akcje:** „Pobierz PDF / DOCX”, „Zapytaj eksperta”, „Zobacz gminy, które już to wdrożyły”

**Definition of Done:** Gotowe są 2 ekrany (formularz i karta usługi).

**Termin:** **nd 6:00**

---

## Task 9: Klikalny prototyp i eksporty do zgłoszenia

**Cel:** Przygotować materiały wymagane w zgłoszeniu na HackTribe: link do makiet UX/UI oraz grafiki do PDF i filmu.

**Zakres:**

- [ ] **Klikalny prototyp głównej ścieżki:** strona główna → opis problemu → dopytanie → wyniki → karta innowacji → „Chcę testować”
- [ ] **Drugi prototyp, ścieżka admina:** powiadomienie → inbox → odpowiedź → widok statusu u autora
- [ ] **Link do Figmy** z dostępem „view” (bez logowania)
- [ ] **Eksport PNG** kluczowych ekranów, po 1–2 na moduł, do PDF i zgłoszenia
- [ ] **Uporządkowanie pliku:** strony _Flows_, _Screens_, _Prototype_, _Foundations_, _Components_

**Definition of Done:** Prototyp otwiera się z linku w oknie incognito, a eksporty są w folderze zespołu.

**Termin:** **nd 7:00**. Później zostaje czas na nagranie filmu i złożenie PDF przed **nd 11:00**.
