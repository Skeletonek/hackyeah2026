"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The part of the Web Speech API used here; TypeScript's DOM lib has no `SpeechRecognition`. */
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionWindow = {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

function getRecognition() {
  const scope = window as unknown as RecognitionWindow;
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

const subscribe = () => () => {};

const ERRORS: Record<string, string> = {
  "not-allowed": "Mikrofon jest wyłączony. Włącz go w ustawieniach przeglądarki albo wpisz tekst.",
  "service-not-allowed": "Mikrofon jest wyłączony. Włącz go w ustawieniach przeglądarki albo wpisz tekst.",
  "audio-capture": "Nie widzę mikrofonu. Podłącz go albo wpisz tekst.",
  "no-speech": "Nic nie usłyszałem. Spróbuj jeszcze raz.",
  network: "Nie udało się rozpoznać mowy. Sprawdź internet albo wpisz tekst.",
};

/** Appends through the native setter, so a React-controlled field sees the change too. */
function appendText(field: HTMLTextAreaElement | HTMLInputElement, text: string) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const current = field.value.trimEnd();
  const next = current ? `${current} ${text}` : text;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, next);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Dictation in Polish: what the person says is appended to the field with
 * `targetId`. Renders nothing when the browser has no speech recognition.
 */
export function MicButton({
  targetId,
  withLabel = false,
  className,
}: {
  /** `id` of the textarea or input that receives the text. */
  targetId: string;
  /** Shows „Powiedz zamiast pisać” next to the icon. */
  withLabel?: boolean;
  className?: string;
}) {
  const supported = useSyncExternalStore(
    subscribe,
    () => Boolean(getRecognition()),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  if (!supported) return null;

  function start() {
    const SpeechRecognition = getRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "pl-PL";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const field = document.getElementById(targetId);
      if (!(field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement)) return;

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        const text = result.isFinal ? result[0].transcript.trim() : "";
        if (text) appendText(field, text);
      }
    };
    recognition.onerror = (event) => {
      // "aborted" is our own stop.
      if (event.error !== "aborted") setMessage(ERRORS[event.error] ?? "Nie udało się rozpoznać mowy. Wpisz tekst.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setMessage((current) => (current === "Słucham…" ? "" : current));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setMessage("Słucham…");
    } catch {
      recognitionRef.current = null;
      setMessage(ERRORS.network);
    }
  }

  return (
    <span data-slot="mic-button" className={cn("inline-flex flex-wrap items-center gap-3", className)}>
      <Button
        variant={listening ? "destructive" : "secondary"}
        size={withLabel ? "default" : "icon"}
        // With a visible label the text itself changes to „Zakończ”.
        aria-pressed={withLabel ? undefined : listening}
        aria-label={withLabel ? undefined : "Powiedz zamiast pisać"}
        onClick={() => (listening ? recognitionRef.current?.stop() : start())}
        className={cn(withLabel && "max-w-full whitespace-normal", listening && "bg-recording")}
      >
        {listening ? <Square aria-hidden fill="currentColor" /> : <Mic aria-hidden />}
        {withLabel && (listening ? "Zakończ" : "Powiedz zamiast pisać")}
      </Button>
      <span role="status" className="text-sm font-bold simple:text-simple-sm">
        {message}
      </span>
    </span>
  );
}
