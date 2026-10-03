"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

/** Sentence by sentence: Chrome cuts off a single long utterance. */
function toSentences(text: string) {
  return text.match(/[^.!?…\n]+[.!?…]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

/**
 * Reads a text in Polish with the browser's speech synthesis („Prościej”).
 * Renders nothing when the browser cannot speak.
 */
export function ReadAloudButton({
  text,
  targetId,
  className,
}: {
  /** What to read. */
  text?: string;
  /** Or the `id` of the element whose text is read. */
  targetId?: string;
  className?: string;
}) {
  const supported = useSyncExternalStore(
    subscribe,
    () => "speechSynthesis" in window,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const pathname = usePathname();

  function stop() {
    if (!speakingRef.current) return;
    speakingRef.current = false;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  // Stops on unmount, on a client navigation and when the page is left or reloaded.
  useEffect(() => {
    const silence = () => {
      if (speakingRef.current) window.speechSynthesis.cancel();
      speakingRef.current = false;
    };
    window.addEventListener("pagehide", silence);
    return () => {
      window.removeEventListener("pagehide", silence);
      silence();
      setSpeaking(false);
    };
  }, [pathname]);

  if (!supported) return null;

  function start() {
    const content = text ?? (targetId ? document.getElementById(targetId)?.innerText : undefined) ?? "";
    const sentences = toSentences(content);
    if (sentences.length === 0) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const voice = synthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith("pl"));

    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = "pl-PL";
      if (voice) utterance.voice = voice;
      if (index === sentences.length - 1) {
        utterance.onend = () => {
          speakingRef.current = false;
          setSpeaking(false);
        };
      }
      utterance.onerror = () => {
        speakingRef.current = false;
        setSpeaking(false);
      };
      synthesis.speak(utterance);
    });

    speakingRef.current = true;
    setSpeaking(true);
  }

  return (
    <Button
      data-slot="read-aloud-button"
      variant="secondary"
      onClick={speaking ? stop : start}
      className={className}
    >
      {speaking ? <Square aria-hidden fill="currentColor" /> : <Volume2 aria-hidden />}
      {speaking ? "Zatrzymaj" : "Przeczytaj na głos"}
    </Button>
  );
}
