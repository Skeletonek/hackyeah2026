# Research: jak eve wpina się w aplikację Next.js + Supabase

Ticket: [SPL-7](https://linear.app/splot-hackyeah/issue/SPL-7) (mapa SPL-5). Stan na 2026-10-03, eve `0.70.3`.

## TL;DR i rekomendacja

- **Da się to zrobić w jednym repo i jednym projekcie Vercel.** `withEve(nextConfig)` z `eve/next` montuje agenta pod `/eve/v1/*` na tym samym originie co aplikacja; lokalnie `next dev` sam startuje serwer eve, na Vercelu agent jest osobnym *service* w tym samym deploymencie. [N]
- **Front nie używa `useChat`.** eve ma własny hook `useEveAgent` (`eve/react`) i własny strumień NDJSON. Części wiadomości wyglądają jak `UIMessage` z AI SDK, ale typy „nie są wymienne”. Komponenty AI Elements działają: scaffold eve sam ich używa. [F]
- **Tożsamość:** w `agent/channels/eve.ts` piszemy własny `AuthFn`, który weryfikuje access token Supabase i zwraca principal `{ principalId: sub, principalType: "user", attributes: { isAnonymous } }`. Narzędzia czytają `ctx.session.auth.current` i wołają Supabase **kluczem sekretnym z jawnym filtrem po `user_id`**. Surowy JWT nie trafia do narzędzi, więc RLS ich nie chroni. [A][MT]
- **Ryzyko jest wysokie:** beta, wydania prawie codziennie, breaking changes w wersjach minor, ponad 1000 otwartych issues, wymagany Node 24. [CH][GH][NPM]

**Rekomendacja.** Logikę dziedzinową (matchmaking, zapisy do Supabase) piszemy jako zwykłe moduły TS w `splot/lib/ai/`, niezależne od frameworka: funkcja i schemat Zod. Asystentów rozmownych stawiamy na eve, ale z twardą bramką: **jeśli po ok. 2 h** nie działa lokalnie i na preview ścieżka *zalogowany lub anonimowy użytkownik → `useEveAgent` → narzędzie czyta Supabase → odpowiedź się streamuje → reload wznawia sesję*, przechodzimy na fallback (AI SDK `streamText` + `useChat` w route handlerze, sekcja 9). Te same moduły z `lib/ai/` owijamy wtedy w `tool()` zamiast `defineTool()`. Wersję eve przypinamy dokładnie (`"eve": "0.70.3"`, bez `^`).

Oznaczenia źródeł są na końcu dokumentu. „Zweryfikowane lokalnie” oznacza, że uruchomiłem to na `eve@0.70.3` w katalogu tymczasowym.

---

## 1. Model wdrożenia

| Pytanie | Odpowiedź |
|---|---|
| Ten sam repo / projekt Vercel? | Tak. `withEve(nextConfig)` szuka `agent/` w katalogu głównym aplikacji Next (czyli `splot/agent/`) i montuje go pod `/eve/v1/*`. Na Vercelu aplikacja i runtime eve deployują się **jako jeden projekt**. `withEve()` dopisuje do Build Output osobny `service` dla eve i `routes`, które kierują `/eve/v1/**` do tego serwisu *przed* routingiem Next. Runtime agenta to nadal osobny serwis (Nitro), ale w tym samym deploymencie. [N] |
| Dev lokalny | `npm run dev` (`next dev`) uruchamia obok serwer eve i przepisuje do niego ścieżki eve, więc przeglądarka rozmawia tylko z originem Next. Sam agent bez Next: `eve dev` (TUI) albo `eve dev --no-ui`. [N][CLI] **Zweryfikowane lokalnie:** `eve dev --no-ui` → `GET /eve/v1/health` zwraca `{"ok":true,"status":"ready",...}`, `POST /eve/v1/session` → `202` + `x-eve-session-id: wrun_…`, a strumień NDJSON emituje `session.started → turn.started → message.received → step.started → …`. Bez poświadczeń modelu tura kończy się `MODEL_CALL_FAILED`, a sesja przechodzi w `session.waiting`. |
| Dodanie do istniejącej apki | `npx eve@latest init .` w katalogu z `package.json` dodaje `agent/` oraz zależności `eve`, `ai`, `zod` i nie rusza istniejących plików. [GS] Następnie `next.config.ts` → `export default withEve(nextConfig)`. [N] |
| Wymagania runtime | `engines.node >= 24` [NPM], peer `ai@^7`. Scaffold ustawia `"engines": {"node": "24.x"}`. Nasz `splot/package.json` nie ma `engines`, a ma `@types/node ^20`, więc trzeba ustawić Node 24 w projekcie Vercel. |
| Workflows / Sandbox / AI Gateway | Workflows: zawsze, bo trzymają trwałe sesje. Lokalnie działa „local world” Workflow SDK, bez konta. [AC] Sandbox: tylko dla domyślnych narzędzi `bash`/`read_file`/`write_file` i plików pomocniczych skilli. `defaultTools: false` wyłącza opcjonalne domyślne narzędzia, a skille w postaci płaskiego markdownu sandboxa nie potrzebują. [BT][SK] AI Gateway: używany, gdy `model` jest stringiem. Na Vercelu uwierzytelnia przez OIDC projektu, poza Vercelem przez `AI_GATEWAY_API_KEY`. [DV][AC] |
| Pułapka: `splot/proxy.ts` | Na Vercelu `/eve/v1/**` idzie do serwisu eve przed routingiem Next [N], więc **nie zakładamy**, że nasz `proxy.ts` (odświeżanie sesji Supabase w cookies) zadziała dla żądań do agenta. Nie weryfikowałem tego. Dlatego token przekazujemy nagłówkiem `Authorization` (sekcja 3), a nie polegamy na cookies. |

## 2. API wywołań i format strumienia

Trasy kanału eve (każda poza `health` przechodzi przez politykę auth): [CE]

- `POST /eve/v1/session` tworzy sesję, opcjonalnie od razu z `{"message": "..."}`; zwraca `{"ok":true,"sessionId":"wrun_…","status":"accepted"}`. Opcjonalne `operationId` daje semantykę „utwórz raz” (niedostępne dla anonimowych callerów).
- `POST /eve/v1/session/:id` wysyła kolejną wiadomość (`message`) albo odpowiedź na HITL (`inputResponses`). Domyślnie `turnPolicy: "steer"`.
- `GET /eve/v1/session/:id/stream?startIndex=N` to strumień **NDJSON**, jedno zdarzenie na linię: `message.appended` (delta tekstu), `message.completed`, `actions.requested`, `action.result`, `turn.completed`, `session.waiting` i inne. `startIndex=0` przewija od początku, `includeTailIndex=1` zwraca nagłówek `x-eve-stream-tail-index` do odczytu bez śledzenia. [SR]
- `…/cancel`, `/clear`, `/compact`, `/reset`.

Front (React): [FO]

```tsx
"use client";
import { useEveAgent } from "eve/react";

const agent = useEveAgent({
  headers: async () => ({ authorization: `Bearer ${await getAccessToken()}` }),
  initialSession: savedSessionId ? { sessionId: savedSessionId, streamIndex: 0 } : undefined,
  resume: savedSessionId !== undefined,
  onSessionChange: (session) => { /* save session.sessionId in Supabase */ },
  prepareSend: (input) => ({ ...input, clientContext: { surface: "idea-assistant" } }),
});
// agent.data.messages: EveMessage[] (parts: text, reasoning, file, dynamic-tool, authorization)
// agent.status: "ready" | "resuming" | "submitted" | "streaming" | "error"
// agent.send(text), agent.respond(...), agent.cancel(), agent.reset()
```

- **Zgodność z `useChat` / UI message stream: brak.** Dokumentacja mówi wprost, że części text, reasoning, file i dynamic-tool „follow the AI SDK `UIMessage` rendering convention, but the types are not interchangeable”, więc przed podaniem ich do API typowanego jako `UIMessage[]` trzeba je zaadaptować. [FO] W pakiecie nie ma adaptera do `useChat`. Eksport `eve/ai` zawiera tylko `evaluate`. [TS]
- Scaffold `eve init --channel-web-nextjs` generuje czat na komponentach **AI Elements** (`components/ai-elements/*`) zasilanych z `useEveAgent`, więc warstwa UI z ekosystemu AI SDK nadaje się do ponownego użycia. Zweryfikowane lokalnie w wygenerowanym `app/_components/agent-chat.tsx`.
- Kod serwerowy (skrypty, Next route handler) może użyć `eve/client`, typowanego klienta tych samych tras. [CL]

## 3. Tożsamość: użytkownik Supabase (także anonimowy) w narzędziach

Jak eve to robi:

- Auth wejściowe siedzi w `agent/channels/eve.ts`: `eveChannel({ auth: [...] })` to uporządkowana lista `AuthFn`. Każda funkcja zwraca `SessionAuthContext` (akceptuje żądanie), `null` (przechodzi dalej) albo rzuca wyjątek (401/403). Domyślna polityka jest *fail closed*: `[vercelOidc(), localDev(), placeholderAuth()]` w produkcji zwraca 401 dla przeglądarki. [A]
- Wynik trafia do `ctx.session.auth.current` (caller bieżącej tury, podmieniany przy każdej wiadomości) i `ctx.session.auth.initiator` (twórca sesji). [A][SC]
- **Route auth nie pilnuje własności sesji.** Kto zna `sessionId` i przejdzie auth, może kontynuować sesję i czytać jej strumień. ACL „ta sesja należy do tego usera” musi napisać aplikacja. [A][MT]
- Tokeny połączeń są „cached per step and never serialized to durable state” [SM]. Dla tożsamości wejściowej eve przenosi do runtime'u tylko metadane principala, a nie token. Wzorzec multi-tenant opiera się na tym, że **narzędzie wybiera poświadczenie na podstawie zweryfikowanego principala**, a model nigdy go nie widzi. [MT]

Fakty po stronie Supabase:

- Użytkownik anonimowy dostaje rolę `authenticated` i claim `is_anonymous` w JWT. [SA]
- Przy asymetrycznych kluczach (nasz projekt używa nowych kluczy `sb_publishable_…` / `sb_secret_…`) token weryfikuje się przez JWKS `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` albo `supabase.auth.getClaims()`. [SK2]

Rekomendowany przepływ (bez kodu w `splot/`, tylko szkic):

```ts
// splot/agent/channels/eve.ts (sketch)
import { eveChannel } from "eve/channels/eve";
import { extractBearerToken, localDev, type AuthFn } from "eve/channels/auth";

function supabaseUser(): AuthFn<Request> {
  return async (request) => {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) return null;
    const claims = await verifySupabaseJwt(token); // getClaims() or JWKS
    if (!claims) return null;
    return {
      authenticator: "supabase",
      issuer: claims.iss,
      principalId: claims.sub,
      principalType: "user",
      subject: claims.sub,
      attributes: { isAnonymous: claims.is_anonymous === true, role: appRole },
    };
  };
}
export default eveChannel({ auth: [supabaseUser(), localDev()] });
```

- Przeglądarka wysyła `Authorization: Bearer <access_token>` przez `useEveAgent({ headers })`. Funkcja jest wywoływana przed każdym żądaniem, także przy reconnectach, więc odświeżony token przechodzi automatycznie. [FO]
- Narzędzia: `const userId = ctx.session.auth.current?.principalId` → `createAdminClient()` (klucz sekretny, **omija RLS**) i **każde zapytanie filtrowane po `userId`**. Gdy `current` jest `null`, rzucamy błąd. Matchmaking czyta publiczne innowacje, więc dla niego to proste. Zapis zgłoszeń wymaga ostrożności. Komentarz w `lib/supabase/admin.ts` zabrania używania klucza sekretnego „on behalf of a signed-in person”, więc to świadomy wyjątek, który trzeba zapisać jako decyzję.
- Alternatywa „JWT forwarding” (token w `attributes`, a narzędzie tworzy klienta z publishable key i nagłówkiem `Authorization`, żeby działał RLS) technicznie by zadziałała, bo `auth.current` odświeża się co turę. Odradzam ją jednak: `attributes` są częścią trwałego stanu sesji i trafiają do obserwowalności, a token żyje 1 h (`jwt_expiry = 3600`), więc długie tury mogą wpaść na wygasły token. Nie znalazłem w docs gwarancji, że `attributes` nie są utrwalane.
- Własność sesji: tabela `agent_sessions(user_id, eve_session_id, skill)`. W `AuthFn` (lub w kanale) sprawdzamy, czy `:sessionId` z URL należy do `sub`. Wiersz tworzymy przed pierwszym `send()` albo w `onSessionChange`. [FO][MT]
- Integracja `eve add connection/supabase` to MCP do **zarządzania projektem** Supabase, z OAuth per user przez Vercel Connect. Nie nadaje się do dostępu end-usera do danych aplikacji. [INT]

## 4. Kilka Skilli Splota (matchmaking, idea assistant, innovation broker)

Uwaga na kolizję nazw: w naszym glosariuszu **Skill** to „tryb rozmowy agenta Splot z własnym promptem i narzędziami” (CONTEXT.md). W eve *skill* to plik markdown ładowany na żądanie przez model narzędziem `load_skill`, który **nie zmienia zestawu narzędzi** („Loading a skill adds instructions, never a new execution surface”). [SK]

Opcje w eve:

| Opcja | Jak | Plusy / minusy |
|---|---|---|
| A. Jeden agent + eve skills | `agent/skills/matchmaking.md`, `idea-assistant.md`, `innovation-broker.md`. Strona przekazuje `clientContext: { surface }` przez `prepareSend`, instrukcje mówią „załaduj skill odpowiadający `surface`”. [SK][FO] | Najmniej konfiguracji, jeden serwis. Wybór skilla zależy jednak od modelu, a wszystkie narzędzia są widoczne zawsze. |
| B. Workspace z nazwanymi agentami | `splot/agents/<name>/agent/…`, `withEve()` wykrywa je sam i montuje pod `/eve/<name>/v1/*`. Front: `useEveAgent({ agent: "broker" })`. [N][PS] | Deterministycznie: każdy Skill Splota ma własny prompt, narzędzia i endpoint, co dokładnie odpowiada definicji z glosariusza. Minusy: osobny serwis i build na każdego agenta, a politykę auth trzeba wpiąć w każdym (wspólny helper w `lib/`). |
| C. Subagenci deklarowani | `agent/subagents/<id>/` | Służą do delegacji wewnątrz tury, nie do osobnych trybów UI. Nie mają własnego endpointu. [SUB][PS] |

**Rekomendacja: B**, bo daje 1:1 z definicją „Skill” w CONTEXT.md. Jeśli build/deploy B okaże się wolny, robimy A z jednym agentem. Dynamiczne instrukcje (`defineDynamic` na `session.started`/`turn.started`) mogą dokleić kontekst użytkownika, np. rolę i gminę. [DC]

## 5. Trwałość sesji, wznowienie, transkrypt

- Sesja to run Vercel Workflow. Każde zdarzenie jest zapisywane trwale, zanim krok się zakończy. Domyślnie sesja żyje **30 dni** (`limits.sessionTimeoutMs`). [SR]
- **Wznowienie po reloadzie: tak.** Zapisujemy `sessionId` (np. w Supabase albo w URL `/…/s/[sessionId]`) i montujemy `useEveAgent({ initialSession: { sessionId, streamIndex: 0 }, resume: true })`. Historia się odtwarza, a niedokończona tura streamuje dalej. Scaffold robi dokładnie to. [N][FO]
- **Transkrypt dla panelu admina:** (1) HTTP: `GET …/stream?startIndex=0&includeTailIndex=1` lub `eve/client` z poświadczeniem serwisowym. (2) W runtime eve: `sessions.attach(id).stream({ startIndex: 0, follow: false })` z `eve/server`, które czyta *dowolną* sesję bez auth. (3) **Hook** `agent/hooks/*.ts` na `message.received` / `message.completed`, który zapisuje wiadomości do Supabase. [SR][HK] Rekomenduję (3), bo panel admina czyta wtedy zwykłą tabelę z RLS. Retencja danych Workflow po zakończeniu runu wynosi na Hobby 1 dzień, na Pro 7 dni [WP], więc nie traktujmy eve jako magazynu transkryptów.

## 6. Dostęp do modeli (AI Gateway)

- `defineAgent({ model: "anthropic/claude-sonnet-5.5" })` przyjmuje string w formacie `provider/model`, który idzie przez AI Gateway. Domyślny model scaffolda to `openai/gpt-6-luna-fast` z `reasoning: "high"`. [AC][CLI]
- Na Vercelu uwierzytelnienie idzie przez OIDC projektu, bez klucza. Lokalnie działa `/login` w TUI, `vercel env pull` (`VERCEL_OIDC_TOKEN`) albo `AI_GATEWAY_API_KEY`. Deploy poza Vercelem wymaga jawnie `AI_GATEWAY_API_KEY` (lub `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` dla helperów `eve/models/*`). [AC][DV]
- Gateway nie dolicza marży do tokenów. Free tier to miesięczny kredyt na **podzbiór modeli** z niższymi limitami (429). Zakup kredytów przenosi zespół na paid tier. [GWP]

## 7. Plan i koszty

eve nie ma osobnego cennika. Płacimy za zasoby Vercela, z których korzysta: Functions, Workflows, Sandbox, AI Gateway i Agent Runs tracing. [P]

- Workflows na **Hobby**: 50 000 zdarzeń/mies. i 1 GB zapisu w cenie, retencja 1 dzień. Na demo hackathonowe wystarczy. [WP]
- Sandbox: nie potrzebujemy go (`defaultTools: false`, skille w markdown).
- AI Gateway: free tier wystarczy na prototyp, o ile wybrany model jest na liście free tier. Inaczej trzeba dokupić kredyty. [GWP]

## 8. Ryzyka przy budowie w ok. 15 h

1. **Dojrzałość.** eve jest w „Beta” (Vercel beta terms) [V]. Repo powstało 2026-06-16, ma około 1033 otwartych issues [GH]. Wydania wychodzą codziennie (0.60 → 0.70.3 między 18.09 a 03.10) [NPM], a minory łamią API: v0.70.0 zmieniło kształt stanu hooków frontu (`ConversationState` zamiast `EveMessageData`), v0.69.0 przebudowało taski i subagentów oraz nazwy metod klienta [CH]. **Przypinamy dokładną wersję.**
2. **Node 24** i peer `ai@^7`. Nasz projekt trzeba podnieść, a w projekcie Vercel ustawić Node 24.
3. **Auth.** Polityka auth i ACL sesji to nasz kod, a domyślny `placeholderAuth()` blokuje produkcję. To realnie ok. 1–2 h.
4. **Własny format wiadomości** (`EveMessage`), więc odpada `useChat` i jego przykłady.
5. **Topologia.** Agent jest osobnym serwisem w deploymencie. `proxy.ts` nie chroni `/eve/**`, build trwa dłużej, a każdy agent z wariantu B to kolejny serwis.
6. **Bus factor zespołu.** Wiedza o eve jest nowa. AI SDK `streamText` + `useChat` to dobrze znana ścieżka z dużą liczbą przykładów.

## 9. Fallback: AI SDK `streamText` w route handlerze

Ten sam efekt dla użytkownika bez eve (AI SDK v7, aktualnie `ai@7.0.127`, `@ai-sdk/react@4.0.130`). [AIS]

```ts
// splot/app/api/agent/[skill]/route.ts (sketch)
import { streamText, convertToModelMessages, tool, isStepCount,
         createUIMessageStreamResponse, toUIMessageStream, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server"; // user's session -> RLS works
import { findMatchingInnovations, matchInputSchema } from "@/lib/ai/matchmaking";

export async function POST(req: Request, ctx: RouteContext<"/api/agent/[skill]">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return new Response("Unauthorized", { status: 401 });
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: "anthropic/claude-sonnet-5.5",   // AI Gateway string; AI_GATEWAY_API_KEY or OIDC
    system: promptFor((await ctx.params).skill),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      find_innovations: tool({
        description: "Find innovations matching a described problem.",
        inputSchema: matchInputSchema,
        execute: (input) => findMatchingInnovations(supabase, input),
      }),
    },
  });
  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
```

- Front: `useChat()` z `@ai-sdk/react` z transportem ustawionym na `/api/agent/<skill>`.
- Tożsamość działa za darmo: route handler ma cookies Supabase, więc narzędzia działają **jako użytkownik, z RLS**. Anonimowy użytkownik to zwykły użytkownik `authenticated` z `is_anonymous`.
- Trwałość i wznowienie robimy sami: zapis `UIMessage[]` do tabeli Supabase w `onFinish` i odczyt przy montowaniu. Nie mamy wznawiania streamu w trakcie tury ani trwałych tur. Na demo to akceptowalne.
- Koszt przejścia z eve na fallback jest mały, jeśli narzędzia od początku żyją w `lib/ai/` jako `(supabaseClient, input) => result` ze schematem Zod.

## 10. Co dalej (dla mapy SPL-5)

- Decyzja: eve (wariant B) z bramką 2 h czy od razu fallback. Rekomendacja: eve z bramką, narzędzia w `lib/ai/` niezależne od frameworka.
- Do zapisania jako decyzja: wyjątek od zasady z `lib/supabase/admin.ts` (narzędzia eve używają klucza sekretnego z filtrem po `principalId`).
- Do sprawdzenia w spike'u: czy `withEve` + nasz `proxy.ts` + pnpm buduje się na Vercelu, Node 24 w projekcie oraz model z free tier Gateway.

---

## Źródła

- [V] Vercel docs, eve: https://vercel.com/docs/eve
- [P] Vercel docs, eve Pricing and Limits: https://vercel.com/docs/eve/pricing
- [WP] Vercel docs, Workflow Pricing and Limits: https://vercel.com/docs/workflows/pricing
- [GWP] Vercel docs, AI Gateway Pricing: https://vercel.com/docs/ai-gateway/pricing
- [GS] eve, Getting Started: https://eve.dev/docs/getting-started
- [N] eve, Next.js: https://eve.dev/docs/guides/frontend/nextjs
- [FO] eve, Frontend overview (`useEveAgent`): https://eve.dev/docs/guides/frontend/overview
- [CL] eve, Client SDK: https://eve.dev/docs/guides/client/overview
- [CE] eve, Base eve channel (HTTP API): https://eve.dev/docs/channels/eve
- [SR] eve, Sessions, Runs & Streaming: https://eve.dev/docs/concepts/sessions-runs-and-streaming
- [A] eve, Authentication: https://eve.dev/docs/guides/auth-and-route-protection
- [SC] eve, Session Context: https://eve.dev/docs/guides/session-context
- [SM] eve, Security Model: https://eve.dev/docs/concepts/security-model
- [MT] eve, Multi-Tenant Outbound Auth: https://eve.dev/docs/patterns/multi-tenant-auth
- [SK] eve, Skills: https://eve.dev/docs/skills
- [SUB] eve, Subagents: https://eve.dev/docs/subagents
- [PS] eve, Project Structure: https://eve.dev/docs/concepts/project-structure
- [DC] eve, Dynamic Capabilities: https://eve.dev/docs/guides/dynamic-capabilities
- [HK] eve, Hooks: https://eve.dev/docs/guides/hooks
- [AC] eve, Agent Configuration: https://eve.dev/docs/agent-config
- [BT] eve, Built-in Tools: https://eve.dev/docs/concepts/built-in-tools
- [DV] eve, Deploy to Vercel: https://eve.dev/docs/guides/deployment/vercel
- [CLI] eve, CLI Reference: https://eve.dev/docs/reference/cli
- [TS] eve, TypeScript API Reference: https://eve.dev/docs/reference/typescript-api
- [CH] eve, Changelog: https://eve.dev/changelog
- [INT] eve, Supabase integration: https://eve.dev/integrations/supabase
- [GH] GitHub `vercel/eve` (API: created 2026-06-16, ~5.4k stars, 1033 open issues, Apache-2.0): https://github.com/vercel/eve
- [NPM] npm `eve` (`latest` 0.70.3, `engines.node >=24`, peer `ai ^7.0.105`): https://www.npmjs.com/package/eve
- [SA] Supabase, Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous
- [SK2] Supabase, JWT Signing Keys: https://supabase.com/docs/guides/auth/signing-keys
- [AIS] AI SDK, Next.js App Router getting started: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
