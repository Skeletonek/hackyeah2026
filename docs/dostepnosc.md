

# Dostępność

Splot spełnia WCAG 2.1 AA, a motyw Kontrast — AAA dla tekstu. Poniżej wymagania, które obowiązują każdy ekran, i wyniki sprawdzenia wszystkich par kolorów.

## Wymagania dla każdego ekranu

- **Kontrast (1.4.3, 1.4.11):** tekst ≥ 4,5:1; tekst duży (≥ 24 px albo ≥ 18,66 px pogrubiony), obramowania pól, ikony i pierścień fokusu ≥ 3:1. Używaj wyłącznie par z tabeli poniżej.
- **Nie tylko kolor (1.4.1):** kategoria = ikona + nazwa; status = ikona + słowo; błąd = ikona + tekst + grubsze obramowanie; zaznaczenie = znak ✓.
- **Tekst:** bazowo 18 px (`body`), nigdy mniej niż 16 px, interlinia ≥ 1,5.
- **Fokus (2.4.7):** każdy element interaktywny ma widoczny fokus: przerwa 2 px + pierścień `ring` 3 px (≥ 3:1 do tła) + poświata `focus-halo`. Nie usuwaj `outline` bez zamiennika.
- **Cele klikalne:** min. 44 × 44 px (`target-min`), także ikony 👍/👎, „×” w tagu i zamknięcie toastu.
- **Powiększenie (1.4.4, 1.4.10):** wszystko w `rem`; przy 200% i szerokości 320 px nic nie jest ucięte ani nie wymaga przewijania w poziomie. Na mobile karty i formularze w jednej kolumnie.
- **Etykiety (3.3.2):** każde pole ma widoczną etykietę `<label>`; podpowiedź i błąd są połączone przez `aria-describedby`.
- **Błędy (3.3.1, 3.3.3):** opisane tekstem przy polu, z instrukcją naprawy. Po wysłaniu formularza z błędami fokus przechodzi do pierwszego błędnego pola.
- **Skip link:** „Przejdź do treści” jako pierwszy element strony, widoczny po fokusie.
- **Komunikaty dynamiczne (4.1.3):** stan „AI myśli” i „Słucham…” w `aria-live="polite"`; błędy w `role="alert"`.
- **Ruch (2.3.3):** przy `prefers-reduced-motion` animacje znikają.
- **Kolejność fokusu:** zgodna z kolejnością czytania; na makietach kluczowych ekranów zaznaczona numerkami.
- **Mapa i wykresy:** zawsze z alternatywą tekstową (lista powiatów, opis trendu jednym zdaniem).

## Tabela kontrastów

Wyliczone wzorem WCAG 2.1 (ten sam co WebAIM Contrast Checker). Próg: tekst 4,5:1 w motywie Jasnym i 7:1 w motywie Kontrast; elementy UI 3:1. Wszystkie 50 par przechodzi.

| Zastosowanie | Para tokenów | Jasny (tekst / tło) | Jasny | Kontrast |
| --- | --- | --- | --- | --- |
| Tekst główny na tle | `foreground` na `background` | #13201E / #F5F8F7 | **15.68:1** ✓ | **21.00:1** ✓ |
| Tekst główny na karcie | `foreground` na `card` | #13201E / #FFFFFF | **16.76:1** ✓ | **21.00:1** ✓ |
| Tekst na tle wyciszonym | `foreground` na `muted` | #13201E / #E8EFED | **14.37:1** ✓ | **17.04:1** ✓ |
| Tekst drugorzędny na tle | `muted-foreground` na `background` | #475955 / #F5F8F7 | **6.95:1** ✓ | **17.14:1** ✓ |
| Tekst drugorzędny na karcie | `muted-foreground` na `card` | #475955 / #FFFFFF | **7.43:1** ✓ | **17.14:1** ✓ |
| Tekst drugorzędny na `muted` (także stan disabled) | `muted-foreground` na `muted` | #475955 / #E8EFED | **6.37:1** ✓ | **13.91:1** ✓ |
| Link / tekst główny kolor na tle | `primary` na `background` | #0B5E57 / #F5F8F7 | **7.14:1** ✓ | **16.13:1** ✓ |
| Link na karcie | `primary` na `card` | #0B5E57 / #FFFFFF | **7.63:1** ✓ | **16.13:1** ✓ |
| Etykieta przycisku głównego | `primary-foreground` na `primary` | #FFFFFF / #0B5E57 | **7.63:1** ✓ | **16.13:1** ✓ |
| Etykieta przycisku — hover | `primary-foreground` na `primary-hover` | #FFFFFF / #08473F | **10.59:1** ✓ | **18.08:1** ✓ |
| Etykieta przycisku — active | `primary-foreground` na `primary-active` | #FFFFFF / #063A34 | **12.63:1** ✓ | **19.13:1** ✓ |
| Przycisk drugorzędny, mój dymek czatu | `secondary-foreground` na `secondary` | #0A4A44 / #DDEDEA | **8.37:1** ✓ | **13.09:1** ✓ |
| Link na `secondary` | `primary` na `secondary` | #0B5E57 / #DDEDEA | **6.31:1** ✓ | **13.09:1** ✓ |
| Podpowiedź AI, pasek „Trwa nabór” | `accent-foreground` na `accent` | #5A3A00 / #FDEDC8 | **8.88:1** ✓ | **11.94:1** ✓ |
| Tekst na szafranie | `on-saffron` na `saffron` | #13201E / #F0AE2E | **8.62:1** ✓ | **16.13:1** ✓ |
| Komunikat błędu pod polem | `destructive` na `card` | #B1251C / #FFFFFF | **6.66:1** ✓ | **9.20:1** ✓ |
| Błąd na tle | `destructive` na `background` | #B1251C / #F5F8F7 | **6.24:1** ✓ | **9.20:1** ✓ |
| Przycisk „Usuń” | `destructive-foreground` na `destructive` | #FFFFFF / #B1251C | **6.66:1** ✓ | **9.20:1** ✓ |
| Alert sukcesu | `success` na `success-soft` | #1C6B35 / #E1F2E5 | **5.63:1** ✓ | **10.44:1** ✓ |
| Sukces na karcie | `success` na `card` | #1C6B35 / #FFFFFF | **6.55:1** ✓ | **13.23:1** ✓ |
| Alert ostrzeżenia | `warning` na `warning-soft` | #8A4F00 / #FFF0D1 | **5.83:1** ✓ | **10.52:1** ✓ |
| Ostrzeżenie na karcie | `warning` na `card` | #8A4F00 / #FFFFFF | **6.56:1** ✓ | **13.16:1** ✓ |
| Alert błędu | `error` na `error-soft` | #B1251C / #FCE7E4 | **5.61:1** ✓ | **7.98:1** ✓ |
| Alert informacji | `info` na `info-soft` | #1D4F9A / #E5EDFB | **6.76:1** ✓ | **9.76:1** ✓ |
| Informacja na karcie | `info` na `card` | #1D4F9A / #FFFFFF | **7.96:1** ✓ | **11.57:1** ✓ |
| Menu admina | `sidebar-foreground` na `sidebar` | #E9F2F0 / #0F2A27 | **13.34:1** ✓ | **21.00:1** ✓ |
| Menu admina — hover | `sidebar-accent-foreground` na `sidebar-accent` | #FFFFFF / #1D403C | **11.35:1** ✓ | **17.04:1** ✓ |
| Menu admina — aktywna pozycja | `sidebar-primary-foreground` na `sidebar-primary` | #13201E / #F0AE2E | **8.62:1** ✓ | **16.13:1** ✓ |
| Obramowanie pola na karcie | `input` na `card` | #677B77 / #FFFFFF | **4.49:1** ✓ | **21.00:1** ✓ |
| Obramowanie pola na tle | `input` na `background` | #677B77 / #F5F8F7 | **4.20:1** ✓ | **21.00:1** ✓ |
| Pierścień fokusu na tle | `ring` na `background` | #13201E / #F5F8F7 | **15.68:1** ✓ | **16.13:1** ✓ |
| Pierścień fokusu na karcie | `ring` na `card` | #13201E / #FFFFFF | **16.76:1** ✓ | **16.13:1** ✓ |
| Pierścień fokusu na poświacie | `ring` na `focus-halo` | #13201E / #F7CF6E | **11.26:1** ✓ | **16.13:1** ✓ |
| Zaznaczony checkbox/radio, aktywny krok | `primary` na `background` | #0B5E57 / #F5F8F7 | **7.14:1** ✓ | **16.13:1** ✓ |
| Przycisk nagrywania | `recording` na `card` | #B1251C / #FFFFFF | **6.66:1** ✓ | **9.20:1** ✓ |
| Fokus w menu admina | `sidebar-ring` na `sidebar` | #F7CF6E / #0F2A27 | **10.22:1** ✓ | **16.13:1** ✓ |
| Odznaka „Starzenie się” | `cat-starzenie` na `cat-starzenie-soft` | #8C2F64 / #F8E6F0 | **6.49:1** ✓ | **10.93:1** ✓ |
| „Starzenie się” na karcie | `cat-starzenie` na `card` | #8C2F64 / #FFFFFF | **7.76:1** ✓ | **12.72:1** ✓ |
| Odznaka „Zdrowie psychiczne” | `cat-zdrowie` na `cat-zdrowie-soft` | #5642A8 / #ECE8FA | **6.38:1** ✓ | **10.38:1** ✓ |
| „Zdrowie psychiczne” na karcie | `cat-zdrowie` na `card` | #5642A8 / #FFFFFF | **7.66:1** ✓ | **12.29:1** ✓ |
| Odznaka „Samotność” | `cat-samotnosc` na `cat-samotnosc-soft` | #1B5C9E / #E3EEFA | **5.82:1** ✓ | **10.14:1** ✓ |
| „Samotność” na karcie | `cat-samotnosc` na `card` | #1B5C9E / #FFFFFF | **6.84:1** ✓ | **12.40:1** ✓ |
| Odznaka „Wykluczenie cyfrowe” | `cat-cyfrowe` na `cat-cyfrowe-soft` | #00687A / #DDF1F4 | **5.51:1** ✓ | **10.78:1** ✓ |
| „Wykluczenie cyfrowe” na karcie | `cat-cyfrowe` na `card` | #00687A / #FFFFFF | **6.44:1** ✓ | **14.15:1** ✓ |
| Odznaka „Dostęp do usług” | `cat-uslugi` na `cat-uslugi-soft` | #2D6A1F / #E5F2DF | **5.67:1** ✓ | **11.74:1** ✓ |
| „Dostęp do usług” na karcie | `cat-uslugi` na `card` | #2D6A1F / #FFFFFF | **6.58:1** ✓ | **14.90:1** ✓ |
| Odznaka „Koordynacja” | `cat-koordynacja` na `cat-koordynacja-soft` | #7A5200 / #FBEFD5 | **6.07:1** ✓ | **11.63:1** ✓ |
| „Koordynacja” na karcie | `cat-koordynacja` na `card` | #7A5200 / #FFFFFF | **6.92:1** ✓ | **14.75:1** ✓ |
| Odznaka „Depopulacja” | `cat-depopulacja` na `cat-depopulacja-soft` | #A33A16 / #FBE7DF | **5.54:1** ✓ | **10.39:1** ✓ |
| „Depopulacja” na karcie | `cat-depopulacja` na `card` | #A33A16 / #FFFFFF | **6.62:1** ✓ | **12.33:1** ✓ |

## Pary, których nie używamy

- `saffron` jako tekst na `background` lub `card` (1,8–1,9:1) — szafran tylko jako wypełnienie, tekst na nim `on-saffron`.
- `border` jako granica pola (1,5:1) — granice pól to `input`.
- `logo-b` na jasnym tle poza logo — logo jest wyłączone z wymogu kontrastu, ale szafranowe kształty nie mogą nieść informacji.


