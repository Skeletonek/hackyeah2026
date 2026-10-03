import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Search, ThumbsUp } from "lucide-react";
import { A11yToolbar } from "@/components/a11y-toolbar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DialogDemo, SheetDemo, TagDemo, ToastDemo } from "./_components/demos";

export const metadata: Metadata = {
  title: "Kontrolki bazowe",
  robots: { index: false },
};

const VARIANTS = [
  ["default", "Główny"],
  ["secondary", "Drugorzędny"],
  ["outline", "Obrys"],
  ["ghost", "Cichy"],
  ["saffron", "Szafran"],
  ["destructive", "Usuń"],
  ["link", "Link"],
] as const;

const SIZES = [
  ["sm", "44 px"],
  ["default", "52 px"],
  ["lg", "64 px"],
  ["cta", "80 px"],
] as const;

const AUDIENCE = [
  { value: "seniors", label: "Seniorzy" },
  { value: "carers", label: "Opiekunowie", description: "Rodzina i opiekunowie nieformalni." },
  { value: "youth", label: "Młodzież" },
  { value: "other", label: "Inna grupa", disabled: true },
];

/** Dev-only sheet of every base control; not linked from the nav. */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-h1 simple:text-simple-h1">Kontrolki bazowe</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Sprawdź każdą kontrolkę w trybach Prościej, Kontrast i A+.
        </p>
        <A11yToolbar />
      </header>

      <Section title="Button">
        {VARIANTS.map(([variant, label]) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            {SIZES.map(([size, sizeLabel]) => (
              <Button key={size} variant={variant} size={size}>
                {label} {sizeLabel}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Search aria-hidden />
            Z ikoną
          </Button>
          <Button variant="outline">
            Zobacz szczegóły
            <ArrowRight aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Tak, pasuje">
            <ThumbsUp aria-hidden />
          </Button>
          <Button loading>Wysyłam…</Button>
          <Button disabled>Niedostępny</Button>
          <Button variant="outline" disabled>
            Niedostępny
          </Button>
          <Button asChild variant="secondary">
            <a href="#main-content">Link jako przycisk</a>
          </Button>
        </div>
      </Section>

      <Section title="Field, Input, Textarea, Select">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Twój adres e-mail" hint="Na ten adres wyślemy link do logowania.">
            <Input type="email" name="email" autoComplete="email" placeholder="np. jan@poczta.pl" />
          </Field>
          <Field
            label="Twój adres e-mail"
            hint="Na ten adres wyślemy link do logowania."
            error="Wpisz adres e-mail z małpą, np. jan@poczta.pl."
          >
            <Input type="email" name="email-invalid" defaultValue="jan(at)poczta" />
          </Field>
          <Field label="Telefon" optional>
            <Input type="tel" name="phone" autoComplete="tel" />
          </Field>
          <Field label="Numer sprawy" hint="Tego pola nie można zmienić.">
            <Input name="case" defaultValue="SPL-2026-0142" disabled />
          </Field>
          <Field label="Opisz problem" hint="Wystarczą dwa, trzy zdania.">
            <Textarea name="problem" placeholder="Np. seniorzy w naszej gminie nie mają jak dojechać do lekarza." />
          </Field>
          <Field label="Opisz problem" error="Opisz problem w co najmniej jednym zdaniu.">
            <Textarea name="problem-invalid" />
          </Field>
          <Field label="Powiat">
            <Select name="county" defaultValue="">
              <option value="">Wybierz powiat</option>
              <option value="krakowski">krakowski</option>
              <option value="nowosadecki">nowosądecki</option>
              <option value="tarnowski">tarnowski</option>
            </Select>
          </Field>
          <Field label="Powiat" error="Wybierz powiat z listy.">
            <Select name="county-invalid" defaultValue="">
              <option value="">Wybierz powiat</option>
              <option value="krakowski">krakowski</option>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Checkbox">
        <Checkbox name="updates" label="Chcę dostawać powiadomienia o nowych naborach" />
        <Checkbox
          name="contact"
          defaultChecked
          label="Zgadzam się na kontakt w sprawie zgłoszenia"
          description="Odezwiemy się tylko w tej sprawie."
        />
        <Checkbox name="terms" label="Akceptuję regulamin" error="Zaznacz to pole, żeby wysłać zgłoszenie." />
        <Checkbox name="locked" label="Opcja niedostępna" disabled />
        <Checkbox name="locked-checked" label="Opcja niedostępna, zaznaczona" disabled defaultChecked />
      </Section>

      <Section title="RadioGroup">
        <div className="grid gap-8 md:grid-cols-2">
          <RadioGroup
            name="audience"
            legend="Dla kogo jest ten pomysł?"
            hint="Wybierz jedną odpowiedź."
            options={AUDIENCE}
            defaultValue="carers"
          />
          <RadioGroup
            name="audience-invalid"
            legend="Dla kogo jest ten pomysł?"
            options={AUDIENCE.slice(0, 3)}
            error="Wybierz jedną odpowiedź."
          />
        </div>
        <RadioGroup
          variant="cards"
          name="scale"
          legend="Ilu osób dotyczy problem?"
          options={[
            { value: "few", label: "Kilku osób" },
            { value: "village", label: "Całej wsi lub osiedla", description: "Na przykład jednego sołectwa." },
            { value: "municipality", label: "Całej gminy" },
            { value: "unknown", label: "Nie wiem", disabled: true },
          ]}
          defaultValue="village"
        />
      </Section>

      <Section title="Tag">
        <TagDemo />
      </Section>

      <Section title="Alert">
        <Alert tone="info" title="Trwa nabór wniosków">
          <p>Wnioski przyjmujemy do 30 listopada.</p>
        </Alert>
        <Alert tone="success" title="Zgłoszenie wysłane">
          <p>
            Numer sprawy: <span className="font-mono font-semibold">SPL-2026-0142</span>.
          </p>
        </Alert>
        <Alert
          tone="warning"
          title="Nie zapisano zmian"
          action={
            <Button variant="outline" size="sm">
              Zapisz teraz
            </Button>
          }
        >
          <p>Zapisz fiszkę, zanim zamkniesz stronę.</p>
        </Alert>
        {/* role="status": a live "alert" should not fire on page load. */}
        <Alert tone="error" role="status" title="Nie udało się wysłać zgłoszenia">
          <p>Sprawdź połączenie z internetem i spróbuj ponownie.</p>
        </Alert>
      </Section>

      <Section title="Toast">
        <ToastDemo />
      </Section>

      <Section title="Dialog i Sheet">
        <div className="flex flex-wrap gap-3">
          <DialogDemo />
          <SheetDemo />
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Opis</TabsTrigger>
            <TabsTrigger value="materials">Materiały</TabsTrigger>
            <TabsTrigger value="reviews">Opinie</TabsTrigger>
            <TabsTrigger value="history" disabled>
              Historia
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description">Opis innowacji prostym językiem.</TabsContent>
          <TabsContent value="materials">Filmy, instrukcje i wzory dokumentów.</TabsContent>
          <TabsContent value="reviews">Opinie organizacji, które testowały rozwiązanie.</TabsContent>
        </Tabs>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b-2 border-border pb-2 text-h2 simple:text-simple-h2">{title}</h2>
      {children}
    </section>
  );
}
