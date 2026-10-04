Splot to platforma innowacji społecznych ROPS w Krakowie (HubMI.pl). Łączy mieszkańców, którzy mają problem, z rozwiązaniami, organizacjami i gminami, które już je znają. Projektujemy ją przede wszystkim dla seniorów i osób o niskich kompetencjach cyfrowych. Jeśli ekran jest jasny dla nich, będzie jasny dla urzędnika, eksperta i NGO.

**Demo:** https://splot.skeletonek.com

## Ekrany

Zrzuty z działającego demo (desktop 1440 px).

### Strona główna i dostępność

Trzy wejścia: „Mam problem”, „Mam pomysł”, „Szukam rozwiązania dla gminy”. Tryb **Prościej** zostawia tylko najważniejsze elementy, tryb **Kontrast** to motyw o kontraście co najmniej 7:1.

| Strona główna | Tryb Prościej | Tryb Kontrast |
| --- | --- | --- |
| ![Strona główna](docs/screenshots/01-home.png) | ![Tryb Prościej](docs/screenshots/02-home-simple-mode.png) | ![Tryb Kontrast](docs/screenshots/03-home-contrast-mode.png) |

### Matchmaking społeczny

Mieszkaniec opisuje problem własnymi słowami albo głosem. Asystent AI szuka pasujących innowacji i wyjaśnia, dlaczego każda z nich pasuje, z cytatem ze źródła.

| Opis problemu | Dopasowane rozwiązania |
| --- | --- |
| ![Opis problemu](docs/screenshots/04-match-describe-problem.png) | ![Dopasowane rozwiązania](docs/screenshots/05-match-results.png) |

### Zasobnik wiedzy

Biblioteka innowacji z filtrami, karta innowacji z oceną testerów, Mapa wyzwań społecznych według powiatów i materiały ROPS.

| Biblioteka innowacji | Karta innowacji |
| --- | --- |
| ![Biblioteka innowacji](docs/screenshots/06-library.png) | ![Karta innowacji](docs/screenshots/07-innovation-card.png) |

| Mapa wyzwań | Materiały |
| --- | --- |
| ![Mapa wyzwań](docs/screenshots/08-challenge-map.png) | ![Materiały](docs/screenshots/09-resources.png) |

### Kreator pomysłów

Fiszka pomysłu w 4 krokach. W czasie naboru generator wniosku grantowego sprawdza kryteria i podpowiada treść.

| Kreator pomysłu | Wniosek grantowy |
| --- | --- |
| ![Kreator pomysłu](docs/screenshots/10-idea-wizard.png) | ![Wniosek grantowy](docs/screenshots/11-grant-application.png) |

### Pośrednik innowacji i oferta dla gmin

Asystent dopasowuje innowację do typu gminy, liczby mieszkańców i budżetu oraz przygotowuje plan usługi.

| Pośrednik innowacji | Szukam rozwiązania dla gminy |
| --- | --- |
| ![Pośrednik innowacji](docs/screenshots/12-innovation-broker.png) | ![Szukam rozwiązania dla gminy](docs/screenshots/13-for-municipalities.png) |

### Komunikacja

Każde zgłoszenie ma numer i stronę statusu z osią etapów i rozmową z ROPS, bez zakładania konta.

![Status zgłoszenia](docs/screenshots/14-submission-status.png)

### Panel ROPS

Skrzynka zgłoszeń z podsumowaniem AI i priorytetem, wątki z mieszkańcami, trendy widoczne tylko dla administratora, pilotaże (Tester innowacji) i prośby o połączenie partnerów.

| Zgłoszenia | Wiadomości |
| --- | --- |
| ![Zgłoszenia](docs/screenshots/15-admin-submissions.png) | ![Wiadomości](docs/screenshots/16-admin-messages.png) |

| Trendy | Pilotaże |
| --- | --- |
| ![Trendy](docs/screenshots/17-admin-trends.png) | ![Pilotaże](docs/screenshots/18-admin-pilots.png) |

| Prośby o połączenie |
| --- |
| ![Prośby o połączenie](docs/screenshots/19-admin-connections.png) |

## Idea marki

Splot to dwie nici skręcone razem: **problem i rozwiązanie, ludzie i instytucje**. Węzły na końcach nici to punkty, które łączymy. Nić morska (`primary`, `logo-a`) to spokój i zaufanie instytucji publicznej. Nić szafranowa (`saffron`, `logo-b`) to ciepło sąsiedzkiej pomocy i złoto z barw Małopolski. Ornament w stanach pustych i na slajdach sekcji nawiązuje do **parzenicy**, sznurkowego haftu z Podhala: dwie nici zwinięte w serce.

## Język i treści

- Mów do użytkownika per „Ty”, krótko i życzliwie: „Opisz problem”, „Twoje zgłoszenie”, „Sprawdź, gdzie jest Twój pomysł”. Ludzie z ROPS w wątkach piszą we własnym imieniu i mogą używać formy „Pan/Pani/Państwo”.
- Nazywaj rzeczy tak, jak mówi mieszkaniec, nie tak, jak działa system: „Opisz problem”, nie „Zgłoś need”; „Szukam rozwiązania dla gminy”, nie „Moduł JST”; „Podpowiedź AI”, nie „Rekomendacja modelu”.
- Przycisk zaczyna się od czasownika i mówi, co się stanie: „Szukaj rozwiązań”, „Wyślij mi na e-mail”, „Zgłoś jako wyzwanie”.
- Błąd mówi, co się stało i jak to naprawić: „Wpisz adres z małpą (@), np. jan@poczta.pl.” Bez przeprosin, bez „Wystąpił błąd”.
- Zdania do 15 słów, jedna myśl w zdaniu, liczby cyframi („3 pomysły”, „5 dni roboczych”). Daty słownie z dniem tygodnia: „czw., 9 października”.
- Numery zgłoszeń zawsze w formacie `SPL-2026-0142`, krojem `case-id`.
- Bez emoji, wykrzykników i żargonu („matchmaking”, „onboarding”, „feedback” zostają w dokumentacji, nie w interfejsie).
- Wszystko, co napisała AI, oznacz odznaką **Podpowiedź AI** (`AiBadge`) i daj obok sposób reakcji (👍/👎, „Zgłoś błąd”, „Edytuj”).
- Osoby w makietach i materiałach są fikcyjne. Gminy i powiaty mogą być prawdziwe (Sękowa, Gorlice, Nowy Targ).

## Kolor

- Tło strony `background`, karty i pola `card`, tekst `foreground`, tekst drugorzędny `muted-foreground`. Każda z tych par ma co najmniej 6,3:1.
- `primary` to jedna główna akcja na ekran, linki, zaznaczenia i aktywny krok. Tekst na nim zawsze `primary-foreground`.
- `saffron` tylko jako wypełnienie: węzły motywu, wejście „Mam pomysł”, etykieta „Teraz” na osi statusu. Tekst na nim `on-saffron`. Nigdy nie używaj go jako koloru tekstu na jasnym tle (1,9:1).
- `accent` (jasny szafran) to tło treści od AI i paska „Trwa nabór”; tekst na nim `accent-foreground`.
- Kolory semantyczne `success`, `warning`, `error`, `info` występują zawsze z ikoną i słowem, a w alertach na swoich tłach `*-soft`.
- Siedem kategorii wyzwań ma własne pary `cat-<kategoria>` / `cat-<kategoria>-soft` i własne ikony (zob. **CategoryBadge**). Na mapie i wykresach używaj tych samych kolorów i ikon.
- Panel ROPS ma ciemne menu boczne: `sidebar`, aktywna pozycja i licznik nowych zgłoszeń w `sidebar-primary`.
- Motyw **Kontrast** (`data-theme="kontrast"`) to dodatkowy motyw o wysokim kontraście: czarne tło, biały tekst, żółte akcje. Każdy tekst ma tam co najmniej 7:1.

## Typografia

- Nagłówki: **Bricolage Grotesque** (`font-display`), style `display`, `h1`–`h4`. Charakterystyczny, ale czytelny krój z pełnymi polskimi znakami.
- Tekst: **Atkinson Hyperlegible Next** (`font-sans`), krój zaprojektowany dla osób słabowidzących (rozróżnia I/l/1, O/0). Bazowy styl `body`: 18 px, interlinia 28 px (1,56). Nic poniżej 16 px (`small`).
- Dane i numery zgłoszeń: **Atkinson Hyperlegible Mono** (`font-mono`, styl `case-id`).
- Etykiety pól `label` (18 px pogrubione) zawsze nad polem; placeholder nie zastępuje etykiety.
- Akapity najwyżej `measure` (68 znaków). Nagłówki z `text-wrap: balance`.
- Wszystkie rozmiary są w `rem`, więc przełącznik „A+” i powiększenie przeglądarki do 200% skalują cały interfejs.

## Układ i odstępy

- Siatka 4 px: `space-1` (4) … `space-9` (96). Odstęp między polami formularza `space-5`, padding karty `space-5`, między sekcjami `space-7`.
- Desktop 1440 px z treścią `container` (1200 px). Mobile 360 px z marginesem `space-4`. Przy 320 px wszystko układa się w jedną kolumnę.
- Każdy element interaktywny ma co najmniej `target-min` (44 × 44 px). Pola i przyciski `control-h` (52 px), duże odpowiedzi `control-h-lg` (64 px), wejścia na stronie głównej `control-h-cta` (80 px).
- Promienie: `radius` (10 px) dla przycisków i pól, `radius-lg` dla kart, `radius-xl` dla dymków i dużych wejść, `radius-full` dla odznak i tagów.
- Cienie tylko na kartach (`shadow-sm`, po najechaniu `shadow-md`) i toastach (`shadow-lg`). W motywie Kontrast cienie znikają, a karty dostają obramowanie 2 px.

## Stany i fokus

Każdy komponent interaktywny ma stany: default, hover, focus, active, disabled i error. Fokus klawiatury wszędzie wygląda tak samo: przerwa 2 px w kolorze tła, pierścień `ring` 3 px i szafranowa poświata `focus-halo`. Disabled to tło `muted` z czytelnym tekstem `muted-foreground` (nie przezroczystość), pola mają wtedy przerywane obramowanie. Error to obramowanie `destructive` 3 px, ikona i tekst błędu pod polem.

## Ikony

Ikony z zestawu **Lucide** (`lucide-react`, domyślny w shadcn/ui): obrys 2 px, 24 px w przyciskach, 20 px w odznakach, 32 px w alertach i CTA. Ikona nigdy nie jest jedynym nośnikiem informacji. Mapowanie kategorii na ikony jest w **CategoryBadge**, pliki SVG w grupie zasobów **Ikony**.

## Motyw graficzny

Motyw „nici” (pas dwóch skręconych nici z węzłami) i ornament „parzenica” są czysto dekoracyjne: zawsze z `aria-hidden="true"`, nigdy nie niosą informacji. Używaj ich na stronie głównej (pod nagłówkiem), w stanach pustych, na slajdach i planszach filmu. Na ekranach roboczych (formularze, panel ROPS) nie ma motywu. Pliki i zasady są w sekcji **Logo i motyw**.

## Ruch

Animacje są krótkie (150–250 ms, ease-out) i tylko tam, gdzie coś się dzieje: puls przycisku nagrywania, trzy węzły w stanie „AI myśli”, kursor strumieniowanej odpowiedzi. Przy `prefers-reduced-motion` wszystkie wyłączają się, a stan opisuje tekst.

## Komponenty

Komponenty są zmapowane na shadcn/ui, żeby developer od razu wiedział, czego użyć. Pełna tabela jest w sekcji **Tokeny w kodzie**. Komponenty własne (bez odpowiednika w shadcn): Stepper, StatusTimeline, ChatBubble, AiThinking, EmptyState, AiBadge.


