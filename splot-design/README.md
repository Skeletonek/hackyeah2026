# Splot — eksport design systemu (Task 1)

Design system (podglądy, zasady, komponenty): https://claude.ai/artifact/Vxwo2p75FotaNDomvQLe24

- `globals.css` — tokeny dla shadcn/ui + Tailwind v4 (motyw Jasny i `data-theme="kontrast"`). Wklej do `app/globals.css`.
- `tokens.json` — wszystkie tokeny (kolory w obu motywach, typografia, odstępy, promienie, rozmiary).
- `tabela-kontrastow.md` — wymagania WCAG i 50 sprawdzonych par kolorów (wszystkie AA, Kontrast AAA).
- `logo/` — logo poziome i sygnet na jasne/ciemne tło (SVG + PNG), favicon (SVG, PNG 16–512, ICO).
- `motyw/` — pas „nici” i ornament „parzenica” (SVG, dekoracyjne).
- `ikony/` — ikony kategorii i kluczowych akcji (Lucide).
- `fonty/` — Bricolage Grotesque, Atkinson Hyperlegible Next i Mono (WOFF2, latin + latin-ext). W Next.js lepiej przez `next/font/google`.
