-- Demo data (fictional people, real municipalities). UI copy stays Polish.
-- Cloud: paste into the SQL Editor or run `pnpm exec supabase db push --include-seed`.
insert into public.innovations (slug, title, lead, description, easy_read_description, categories, stage, pilot_slots, published)
values
  (
    'wiejski-bus-na-telefon',
    'Wiejski bus na telefon',
    'Gminny bus zawozi seniorów do lekarza i urzędu. Kurs zamawia się telefonicznie dzień wcześniej.',
    'Gmina ma jeden mały bus i kierowcę na pół etatu. Senior albo ktoś z rodziny dzwoni do urzędu dzień przed wizytą u lekarza. Koordynatorka układa trasę tak, żeby w jednym kursie zabrać kilka osób.',
    'Gmina ma mały bus. Dzwonisz do urzędu dzień przed wizytą u lekarza. Bus przyjeżdża pod Twój dom.',
    '{service_access,aging}', 'deployed', 6, true
  ),
  (
    'sasiedzcy-kierowcy',
    'Sąsiedzcy kierowcy',
    'Mieszkańcy wożą sąsiadów do lekarza, a gmina zwraca im koszt paliwa.',
    'Gmina prowadzi listę wolontariuszy z samochodem. Osoba potrzebująca dzwoni do koordynatora, który dobiera kierowcę z okolicy. Gmina zwraca kierowcy koszt paliwa według kilometrówki.',
    'Sąsiad zawozi Cię do lekarza. Gmina płaci mu za paliwo.',
    '{service_access,loneliness}', 'pilot', 4, true
  ),
  (
    'cyfrowy-wolontariusz',
    'Cyfrowy wolontariusz w bibliotece',
    'Uczniowie uczą seniorów obsługi telefonu i e-usług w gminnej bibliotece.',
    'Raz w tygodniu w bibliotece dyżurują uczniowie szkoły średniej. Seniorzy przychodzą z własnym telefonem i uczą się m.in. umawiać wizyty w IKP i rozmawiać z rodziną przez wideo.',
    'Młodzi ludzie pomagają seniorom z telefonem. Spotkania są w bibliotece.',
    '{digital_exclusion,aging}', 'deployed', 3, true
  );
