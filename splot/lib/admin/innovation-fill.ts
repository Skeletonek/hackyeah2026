import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { generateText, Output } from "ai";
import * as cheerio from "cheerio";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { TEXT_MODEL } from "@/lib/ai/models";
import { MAX_CATEGORIES, SECTION_FIELDS } from "@/lib/admin/library-fields";
import { Constants, type Enums } from "@/lib/supabase/database.types";

/** „Wklej PDF lub link → AI wypełnia pola”: source text in, editor fields out. Nothing is stored. */

export const MAX_PDF_BYTES = 8 * 1024 * 1024;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const MAX_SOURCE_CHARS = 40_000;
/** Below this many non-space characters a text source says too little to fill the form. */
const MIN_SOURCE_CHARS = 200;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

/** The editor fields AI may fill. Text fields left out of the source stay null. */
export type InnovationFill = {
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
  adopters: string | null;
  evidence: string | null;
  target_groups: Enums<"target_group">[];
  categories: Enums<"challenge_category">[];
  stage: Enums<"innovation_stage">;
};

export type InnovationFillField = keyof InnovationFill;

/**
 * What the model reads: extracted text, or the PDF itself when it has no text
 * layer (a scan, or a page printed as images by „Microsoft Print to PDF”).
 */
export type FillSource = { text: string } | { pdf: Uint8Array; filename: string };

/** Whether the source says enough to fill the form. A PDF without text is read by the model from its images. */
export function hasEnoughText(source: FillSource) {
  return !("text" in source) || source.text.replace(/\s+/g, "").length >= MIN_SOURCE_CHARS;
}

/** A failure the admin can act on; its message is shown as is. */
export class SourceError extends Error {}

const SYSTEM = `Wypełniasz kartę innowacji społecznej w Bibliotece Innowacji Społecznych ROPS Kraków na podstawie materiału źródłowego (strona internetowa albo folder PDF).

Zasady:
- Tylko fakty z materiału. Niczego nie dopisuj ani nie zgaduj. Jeśli materiał nie mówi czegoś, zwróć null.
- Pisz po polsku, rzeczowo, pełnymi zdaniami, bez marketingu i wykrzykników. Zwykły tekst, bez nagłówków i pogrubień.
- Nie przepisuj danych osobowych: imion i nazwisk osób prywatnych, adresów e-mail, numerów telefonów, adresów domowych. Nazwy instytucji i organizacji są w porządku.
- Pomiń menu, stopki, informacje o ciasteczkach i inne elementy strony, które nie opisują innowacji.

Pola:
- title: nazwa innowacji, bez cudzysłowów.
- lead: jedno, dwa zdania zajawki na kartę w wynikach, najwyżej 300 znaków.
- ${SECTION_FIELDS.map((section) => `${section.name}: „${section.label}”`).join("\n- ")}.
- target_groups: grupy odbiorców z listy, tylko te wprost wymienione.
- categories: od 1 do ${MAX_CATEGORIES} wyzwań społecznych, na które innowacja odpowiada najbardziej bezpośrednio, od najważniejszego.
- stage: idea (pomysł, jeszcze nie testowany), pilot (testowana w kilku miejscach), deployed (działa na stałe).`;

const text = (description: string) => z.string().nullable().describe(description);

const schema = z.object({
  title: z.string().describe("Nazwa innowacji"),
  lead: text("Zajawka, 1–2 zdania"),
  solution: text("Na czym polega"),
  problem: text("Jaki problem rozwiązuje"),
  audience: text("Odbiorcy"),
  adopters: text("Kto może skorzystać, np. jakie instytucje mogą ją wdrożyć"),
  evidence: text("Czy to działa: wyniki, liczby, opinie"),
  target_groups: z.array(z.enum(Constants.public.Enums.target_group)),
  categories: z.array(z.enum(Constants.public.Enums.challenge_category)),
  stage: z.enum(Constants.public.Enums.innovation_stage),
});

/** One model call: the source → the editor fields, with personal contact data removed. */
export async function fillInnovation(source: FillSource): Promise<InnovationFill> {
  const { output } = await generateText({
    model: TEXT_MODEL,
    system: SYSTEM,
    ...("text" in source
      ? { prompt: `Materiał źródłowy:\n\n${stripContacts(source.text).slice(0, MAX_SOURCE_CHARS)}` }
      : {
          messages: [
            {
              role: "user" as const,
              content: [
                {
                  type: "text" as const,
                  text: "Materiał źródłowy jest w załączonym pliku PDF. To może być skan albo strona wydrukowana jako obraz: odczytaj tekst ze stron.",
                },
                { type: "file" as const, data: source.pdf, mediaType: "application/pdf", filename: source.filename },
              ],
            },
          ],
        }),
    output: Output.object({ schema }),
  });

  const clean = (value: string | null, max: number) => {
    const cleaned = value ? stripContacts(value).trim().slice(0, max) : "";
    return cleaned || null;
  };
  return {
    title: clean(output.title, 200) ?? "",
    lead: clean(output.lead, 500),
    solution: clean(output.solution, 5000),
    problem: clean(output.problem, 5000),
    audience: clean(output.audience, 5000),
    adopters: clean(output.adopters, 5000),
    evidence: clean(output.evidence, 5000),
    target_groups: [...new Set(output.target_groups)],
    categories: [...new Set(output.categories)].slice(0, MAX_CATEGORIES),
    stage: output.stage,
  };
}

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
/** Polish numbers: +48 / 0048 prefix, 9 digits in 3-3-3 or 2-3-2-2 groups. */
const PHONE = /(?:(?:\+|00)\s?48[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\d{3}[\s.-]?\d{3}[\s.-]?\d{3})(?!\d)/g;
/** Other international numbers, e.g. +44 20 7946 0958. */
const INTERNATIONAL_PHONE = /\+\d{1,3}(?:[\s.-]?\d){6,12}(?!\d)/g;

/** Removes e-mail addresses and phone numbers, so they never reach the form. */
export function stripContacts(value: string) {
  return value
    .replace(EMAIL, "")
    .replace(INTERNATIONAL_PHONE, "")
    .replace(PHONE, (match, offset: number, whole: string) =>
      // Keep years and other numbers glued to digits or letters, e.g. „2019–2023”.
      /[\p{L}\p{N}]/u.test(whole[offset - 1] ?? "") ? match : "",
    )
    .replace(/(?:tel\.?|telefon|e-?mail|kontakt)\s*:\s*(?=[\n,;.)]|$)/gim, "")
    .replace(/[ \t]{2,}/g, " ");
}

/** An uploaded PDF as a fill source. The file is read in memory and never stored. */
export async function sourceFromPdf(file: File): Promise<FillSource> {
  if (file.size > MAX_PDF_BYTES) throw new SourceError("Plik jest za duży. Wybierz PDF do 8 MB.");
  return pdfSource(new Uint8Array(await file.arrayBuffer()), file.name);
}

/** A web page or a linked PDF as a fill source, fetched server-side. */
export async function sourceFromUrl(url: string): Promise<FillSource> {
  const response = await fetchPublic(new URL(url));
  const type = response.headers.get("content-type") ?? "";
  const isPdf = type.includes("application/pdf");
  if (!isPdf && !type.includes("text/html") && !type.includes("text/plain")) {
    throw new SourceError("Pod tym linkiem nie ma strony ani pliku PDF. Wklej inny link albo dodaj plik.");
  }

  const bytes = await readCapped(response, isPdf ? MAX_PDF_BYTES : MAX_HTML_BYTES);
  if (isPdf) return pdfSource(bytes, new URL(url).pathname.split("/").pop() || "material.pdf");
  const body = new TextDecoder(charset(type)).decode(bytes);
  return { text: type.includes("text/html") ? htmlText(body) : body };
}

/** The PDF's text layer, or the PDF itself when it has (almost) none. */
async function pdfSource(bytes: Uint8Array, filename: string): Promise<FillSource> {
  try {
    // pdf.js may detach the buffer it parses, so it gets a copy.
    const pdf = await getDocumentProxy(bytes.slice());
    const { text } = await extractText(pdf, { mergePages: true });
    return hasEnoughText({ text }) ? { text } : { pdf: bytes, filename };
  } catch {
    throw new SourceError("Nie udało się odczytać pliku PDF. Sprawdź, czy to nie jest skan albo plik z hasłem.");
  }
}

/** Main content of a page as plain text, one block per line. */
function htmlText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript, template, svg, iframe, form, nav, header, footer, aside").remove();
  const root = $("main").first().length ? $("main").first() : $("article").first().length ? $("article").first() : $("body");
  root.find("p, li, h1, h2, h3, h4, h5, h6, br, div, section, tr").after("\n");
  const title = $("title").first().text().trim();
  const body = root
    .text()
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  return title ? `${title}\n\n${body}` : body;
}

/** Follows redirects by hand, so every hop is checked against private addresses. */
async function fetchPublic(url: URL): Promise<Response> {
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { accept: "text/html,application/pdf;q=0.9,text/plain;q=0.8", "user-agent": "SplotBot/1.0" },
      });
    } catch {
      throw new SourceError("Nie udało się otworzyć linku. Sprawdź adres albo dodaj plik PDF.");
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) {
      throw new SourceError(`Strona odpowiedziała błędem (${response.status}). Sprawdź link albo dodaj plik PDF.`);
    }
    return response;
  }
  throw new SourceError("Link przekierowuje zbyt wiele razy. Wklej adres docelowej strony.");
}

async function assertPublic(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SourceError("Wpisz pełny adres, który zaczyna się od https://.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((entry) => entry.address);
  } catch {
    throw new SourceError("Nie znaleziono takiej strony. Sprawdź adres.");
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new SourceError("Ten adres nie jest publiczną stroną. Wklej link do strony w internecie.");
  }
}

function isPrivateAddress(address: string) {
  const v4 = address.startsWith("::ffff:") ? address.slice(7) : address;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const v6 = address.toLowerCase();
  return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

async function readCapped(response: Response, max: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length"));
  if (declared > max) throw new SourceError("Materiał pod linkiem jest za duży. Dodaj plik PDF do 8 MB.");
  if (!response.body) return new Uint8Array();

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new SourceError("Materiał pod linkiem jest za duży. Dodaj plik PDF do 8 MB.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function charset(contentType: string) {
  const match = /charset=([\w-]+)/i.exec(contentType);
  try {
    return match ? new TextDecoder(match[1]).encoding : "utf-8";
  } catch {
    return "utf-8";
  }
}
