# Splot — aplikacja

Next.js 16 (App Router) + Supabase + Tailwind v4 + shadcn/ui. Tokeny design systemu: `../splot-design/`.

## Start

```bash
pnpm install
cp .env.example .env.local   # uzupełnij klucze z Supabase → Project Settings → API Keys
pnpm dev
```

Baza działa w chmurze (projekt `lxuhkjmjfgvfutegwxjz`), bez Dockera:

```bash
pnpm exec supabase login
pnpm db:link --project-ref lxuhkjmjfgvfutegwxjz
pnpm db:push          # migracje z supabase/migrations
pnpm db:types         # regeneruje lib/supabase/database.types.ts
pnpm auth:push        # szablony maili i ustawienia auth z supabase/config.toml
```

Nowa migracja: `pnpm db:new <name>`.

## Role i dostęp

- Role globalne (`profiles.role`): `user`, `expert`, `admin`. Rolę nadaje admin przez `set_user_role()` albo SQL.
- Tester innowacji to relacja (`pilots`), nie rola. Tak samo autor innowacji i uczestnik wątku.
- Bezpieczeństwo trzyma RLS w bazie. `proxy.ts` i layouty (`requireUser`, `requireRole` w `lib/auth.ts`) to tylko przekierowania.
- `lib/supabase/admin.ts` (klucz sekretny) omija RLS — tylko do zadań systemowych na serwerze.

## Zasady

- Kod, nazwy w bazie, pliki i komentarze po angielsku; teksty w UI po polsku.
- Pierwszy admin: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`
