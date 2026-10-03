

# Tokeny w kodzie

Tokeny mają nazwy zgodne z konwencją shadcn/ui (`--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar-*`). Dodatkowo: `--saffron`, `--success`, `--warning`, `--error`, `--info` (+ `*-soft`), `--cat-*`, `--focus-halo`, `--recording`, `--logo-*`.

## Jak wdrożyć (Next.js + shadcn/ui + Tailwind v4)

1. Zainstaluj shadcn/ui (`npx shadcn@latest init`) i podmień zawartość `app/globals.css` na plik `globals.css` z eksportu (folder zespołu `splot-design/`). Motyw Kontrast to `data-theme="kontrast"` na `<html>`; w Tailwindzie wariant `kontrast:`.
2. Fonty przez `next/font/google` z `subsets: ["latin", "latin-ext"]`: `Bricolage_Grotesque` → `--font-display`, `Atkinson_Hyperlegible_Next` → `--font-sans`, `Atkinson_Hyperlegible_Mono` → `--font-mono`.
3. Ikony: `lucide-react`, `strokeWidth={2}`, `size={24}`.
4. Klasy: `bg-primary text-primary-foreground`, `bg-cat-starzenie-soft text-cat-starzenie`, `border-input`, `text-muted-foreground`, `font-display text-h1`, `rounded-lg` (16 px), `rounded-md` (10 px).
5. Zmień domyślne rozmiary shadcn: przycisk `h-13 px-6 text-base font-bold` (52 px), `size="lg"` → `h-16`, CTA → `h-20 text-[1.375rem] rounded-xl`; `Input` → `h-13 border-2 text-base`; `Checkbox` → `size-7 border-2`.
6. Fokus: zostaw globalny `:focus-visible` z `globals.css` i usuń z komponentów shadcn klasy `focus-visible:ring-[3px] focus-visible:ring-ring/50` (zastępuje je wspólny pierścień).

## Mapowanie komponentów na shadcn/ui

| Komponent Splot | shadcn/ui | Zmiany względem domyślnego |
| --- | --- | --- |
| Button | `button` | warianty `primary` (default), `secondary`, `outline`, `ghost`, `destructive`, `link` + nowy `saffron`; rozmiary 44/52/64/80 px |
| Input | `input` + `label` | obramowanie 2 px `input`, etykieta nad polem, błąd pod polem |
| MicButton | `button` (`size="icon"` w polu) / `toggle` | `aria-pressed`, stan `recording`, komunikat „Słucham…” |
| Textarea | `textarea` | jak Input, min. 128 px |
| Select | `native-select` | natywny `<select>`, 52 px |
| Checkbox | `checkbox` | 28 px, obramowanie 2 px |
| RadioGroup | `radio-group` | wariant `cards` (64 px) dla dopytania AI |
| CategoryBadge | `badge` | ikona + nazwa + tokeny `cat-*` |
| Tag | `toggle` (+ `badge` dla aktywnego filtra) | pigułka 44 px, `aria-pressed`, ikona ✓ |
| AiBadge | `badge` | tło `accent`, ikona `sparkles` |
| InnovationCard | `card` | blok „Dlaczego to pasuje”, 👍/👎, „Zgłoś błąd” |
| Alert | `alert` | 4 tony z ikonami i tłami `*-soft` |
| Toast | `sonner` | z akcją nie znika sam; bez akcji 8 s |
| Stepper | — (własny) | `<nav><ol>`, „Krok 2 z 4” |
| StatusTimeline | — (własny) | `<ol>`, stany done / current / todo |
| ChatBubble | — (własny) | `me` / `them` / `ai` |
| AiThinking | — (własny) + `skeleton` | postęp słowami, `aria-live` |
| EmptyState | — (własny) | ornament parzenicy |
| A11yToolbar | `toggle-group` | Prościej / Kontrast / A+ |
| Layout admina | `sidebar` | tokeny `sidebar-*`, licznik nowych zgłoszeń `sidebar-primary` |
| Okna | `dialog`, `sheet` | `rounded-lg`, `shadow-lg`, przycisk zamknięcia 44 px |
| Zakładki | `tabs` | wysokość 44 px |

## Plik `globals.css`

Pełny plik (do skopiowania) jest w folderze zespołu `splot-design/globals.css`. Skrót:

```css
:root {
  --background: #F5F8F7;  --foreground: #13201E;
  --card: #FFFFFF;        --muted: #E8EFED;  --muted-foreground: #475955;
  --primary: #0B5E57;     --primary-foreground: #FFFFFF;
  --secondary: #DDEDEA;   --secondary-foreground: #0A4A44;
  --accent: #FDEDC8;      --accent-foreground: #5A3A00;
  --destructive: #B1251C; --border: #C8D4D1; --input: #677B77; --ring: #13201E;
  --saffron: #F0AE2E;     --focus-halo: #F7CF6E;
  --radius: 10px;
}
[data-theme="kontrast"] {
  --background: #000000;  --foreground: #FFFFFF;
  --primary: #FFE14D;     --primary-foreground: #000000;
  --border: #FFFFFF;      --input: #FFFFFF; --ring: #FFE14D;
}
```


