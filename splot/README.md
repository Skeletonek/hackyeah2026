# Splot — aplikacja

Next.js 16 (App Router) + Supabase + Tailwind v4 + shadcn/ui. Tokeny design systemu: `../splot-design/`.

## Podłączenie do Supabase

Wszyscy pracujemy na **jednym projekcie Supabase w chmurze**: `lxuhkjmjfgvfutegwxjz`. Docker nie jest potrzebny.

### 1. Zależności i klucze

```bash
cd splot
pnpm install
cp .env.example .env.local
```

W `.env.local` wpisz wartości z **Supabase Dashboard → Project Settings → API Keys**:

| Zmienna | Skąd |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lxuhkjmjfgvfutegwxjz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | klucz `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | klucz `sb_secret_…` — **tylko serwer**, nie wklejaj go na czat ani do kodu |

Nie masz dostępu do Dashboardu? Poproś o zaproszenie do organizacji w Supabase.

### 2. Uruchomienie

```bash
pnpm dev
```

Wejdź na http://localhost:3000. Strona główna pokazuje 3 innowacje z bazy — jeśli je widzisz, połączenie działa.

### 3. CLI (tylko jeśli zmieniasz bazę)

Do samego pisania frontu wystarczą kroki 1–2. CLI jest potrzebne, gdy dodajesz migracje albo generujesz typy:

```bash
pnpm exec supabase login                               # otwiera przeglądarkę
pnpm db:link --project-ref lxuhkjmjfgvfutegwxjz        # pyta o hasło do bazy (od osoby, która zakładała projekt)
```

## Zmiany w bazie

1. `pnpm db:new <nazwa_po_angielsku>` — tworzy plik w `supabase/migrations/`.
2. Napisz SQL. **Każda nowa tabela musi mieć w tej samej migracji:**
   - `alter table … enable row level security;` i polityki RLS,
   - jawne `grant` dla `anon` / `authenticated` / `service_role`. Nowe projekty Supabase nie nadają ich automatycznie; bez nich API zwraca `permission denied` (wzór: `supabase/migrations/*_data_api_grants.sql`).
3. `pnpm exec supabase db push --dry-run` — podgląd, potem `pnpm db:push`.
4. `pnpm db:types` — regeneruje `lib/supabase/database.types.ts`. Commituj go razem z migracją.

Zasady:
- Migracji już wypchniętych **nie edytujemy** — poprawki to nowa migracja.
- Pushuje jedna osoba naraz; przed pushem `git pull`, żeby mieć wszystkie migracje.
- Seed (`supabase/seed.sql`) jest już w bazie; nie uruchamiaj go drugi raz (`slug` jest unikalny).

## Ustawienia auth (jednorazowo, w Dashboard)

Konfiguracja auth z `supabase/config.toml` **nie** przechodzi przez `db push`. W chmurze ustaw ją ręcznie w **Authentication**:

- **Sign In / Providers → Anonymous sign-ins: włączone** (zgłoszenie bez konta). Na produkcji dodaj CAPTCHA (Turnstile).
- **URL Configuration → Site URL**: adres aplikacji (lokalnie `http://localhost:3000`, potem adres z Vercela). **Redirect URLs**: `http://localhost:3000/**` i adres produkcyjny z `/**`.
- **Emails → Templates → Magic Link** i **Confirm signup**: treść z `supabase/templates/magic-link.html`; **Change Email Address**: z `email-change.html`. Link musi prowadzić na `/auth/confirm?token_hash=…`, inaczej logowanie nie zadziała.
- **Emails → SMTP Settings**: własny SMTP (np. Resend). Wbudowany wysyła tylko kilka maili na godzinę — na demo nie wystarczy.

Alternatywa: `pnpm auth:push` wypycha te ustawienia z `config.toml`, ale **nadpisuje** całą konfigurację auth w projekcie (w tym Site URL). Uzgodnij to z zespołem.

## Role i dostęp

- Role globalne (`profiles.role`): `user`, `expert`, `admin`. Nowe konto dostaje `user`.
- Tester innowacji to relacja (`pilots`), nie rola. Tak samo autor innowacji i uczestnik wątku.
- Bezpieczeństwo trzyma RLS w bazie. `proxy.ts` i layouty (`requireUser`, `requireRole` w `lib/auth.ts`) to tylko przekierowania.
- `lib/supabase/admin.ts` (klucz sekretny) omija RLS — tylko do zadań systemowych na serwerze.
- Pierwszy admin (SQL Editor w Dashboard):

  ```sql
  update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'twoj@adres.pl');
  ```

  Kolejnych adminów i ekspertów nadaje admin przez `set_user_role()`.

## Konwencje

- Kod, nazwy w bazie, pliki i komentarze po angielsku; teksty w UI po polsku.
- Klient Supabase: `lib/supabase/server.ts` w Server Components i akcjach, `lib/supabase/client.ts` w komponentach klienckich.
- Na serwerze tożsamość sprawdzamy przez `getClaims()` (`getCurrentUser` w `lib/auth.ts`), nigdy przez `getSession()`.
