"use client";

import { useEffect, useId, useRef, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { CircleAlert, FileText, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { AiBadge } from "@/components/ai/ai-badge";
import { AiHint } from "@/components/ai/ai-hint";
import { AiThinking } from "@/components/ai/ai-thinking";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  CANVAS_CELLS,
  CANVAS_TEXT_MAX,
  type Canvas,
  type CanvasCell,
  type CanvasEntry,
  type CanvasField,
  type CardCellKey,
} from "@/lib/ideas/canvas";
import { ideaStepHref } from "@/lib/ideas/card";
import { cn } from "@/lib/utils";
import { fillCanvas, saveCanvasField, suggestCanvasField } from "../actions";
import styles from "./canvas.module.css";

type FillState = { status: "pending" | "done" } | { status: "failed"; error: string };

/**
 * KRE5: the ten cells of the canvas. Three come from the idea card; the other
 * seven are drafted by AI on the first open and edited here, one cell at a time.
 */
export function CanvasBoard({
  ideaId,
  cardTexts,
  initialCanvas,
  editable,
  fillOnOpen,
}: {
  ideaId: string;
  /** Problem, Rozwiązanie and Odbiorcy, as the idea card has them now. */
  cardTexts: Record<CardCellKey, string>;
  initialCanvas: Canvas;
  /** Only the author changes the cells. */
  editable: boolean;
  /** Nobody opened this canvas yet: ask AI for the first draft. */
  fillOnOpen: boolean;
}) {
  const [canvas, setCanvas] = useState(initialCanvas);
  const [fill, setFill] = useState<FillState>({ status: fillOnOpen ? "pending" : "done" });
  const [announcement, setAnnouncement] = useState("");
  const fillStarted = useRef(false);

  const runFill = async () => {
    const result = await fillCanvas(ideaId);
    if ("error" in result) {
      setFill({ status: "failed", error: result.error });
      return;
    }
    setCanvas(result.canvas);
    setFill({ status: "done" });
    setAnnouncement("Kanwa jest wypełniona. Sprawdź propozycje AI.");
  };

  useEffect(() => {
    // The ref keeps a re-run of the effect from asking the model twice.
    if (!fillOnOpen || fillStarted.current) return;
    fillStarted.current = true;
    void runFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on the first open
  }, []);

  const filling = fill.status === "pending";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base simple:text-simple-base">
        <span className="font-bold">Skąd treść:</span>
        <FromCard />
        <AiBadge>Propozycja AI</AiBadge>
        <ToFill />
      </div>

      {filling && <AiThinking label="Wypełniam kanwę z Twojej fiszki…" className={styles.noPrint} />}
      {fill.status === "failed" && (
        <Alert
          tone="error"
          title="Nie udało się wypełnić kanwy"
          className={styles.noPrint}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setFill({ status: "pending" });
                void runFill();
              }}
            >
              <RotateCcw aria-hidden strokeWidth={2} />
              Spróbuj ponownie
            </Button>
          }
        >
          <p>{fill.error}</p>
        </Alert>
      )}

      <div className={styles.grid}>
        {CANVAS_CELLS.map((cell) =>
          cell.kind === "card" ? (
            <Cell key={cell.key} cell={cell} empty={!cardTexts[cell.key]}>
              {(headingId) => (
                <>
                  <CellHeader cell={cell} headingId={headingId}>
                    {editable && (
                      <Button asChild variant="ghost" size="sm" className={styles.noPrint}>
                        <Link href={ideaStepHref(ideaId, cell.step)}>
                          <Pencil aria-hidden className="size-5" strokeWidth={2} />
                          Edytuj<span className="sr-only"> pole: {cell.title}</span>
                        </Link>
                      </Button>
                    )}
                  </CellHeader>
                  <Question>{cell.question}</Question>
                  {cardTexts[cell.key] ? <CellText>{cardTexts[cell.key]}</CellText> : <ToFill className="grow" />}
                  <FromCard className="text-muted-foreground" />
                </>
              )}
            </Cell>
          ) : (
            <FieldCell
              key={cell.key}
              ideaId={ideaId}
              cell={cell}
              field={cell.key}
              entry={canvas[cell.key]}
              editable={editable}
              filling={filling}
              onSaved={(next, message) => {
                setCanvas(next);
                setAnnouncement(message);
              }}
            />
          ),
        )}
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

type Hint = { status: "loading" } | { status: "ready"; text: string } | { status: "error"; error: string };

/** One of the seven cells stored in `ideas.canvas`. */
function FieldCell({
  ideaId,
  cell,
  field,
  entry,
  editable,
  filling,
  onSaved,
}: {
  ideaId: string;
  cell: CanvasCell;
  field: CanvasField;
  entry: CanvasEntry | undefined;
  editable: boolean;
  /** The first draft is on its way: nothing to edit yet. */
  filling: boolean;
  onSaved: (canvas: Canvas, message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [hint, setHint] = useState<Hint | null>(null);
  const [saving, startSaving] = useTransition();
  const editButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const id = useId();
  const questionId = `${id}-question`;
  const errorId = `${id}-error`;

  const text = entry?.text ?? "";

  // Closing the editor or putting a hint in gives the focus back to „Edytuj”.
  useEffect(() => {
    if (editing || !restoreFocus.current) return;
    restoreFocus.current = false;
    editButton.current?.focus();
  });

  const save = (value: string, source: CanvasEntry["source"]) => {
    startSaving(async () => {
      const result = await saveCanvasField(ideaId, { field, text: value, source });
      if ("error" in result) {
        setError(result.fieldErrors?.text?.[0] ?? result.error);
        return;
      }
      restoreFocus.current = true;
      setError(undefined);
      setEditing(false);
      setHint(null);
      onSaved(result.canvas, `Zapisaliśmy pole: ${cell.title}.`);
    });
  };

  const suggest = async () => {
    setError(undefined);
    setHint({ status: "loading" });
    const result = await suggestCanvasField(ideaId, field);
    setHint("error" in result ? { status: "error", error: result.error } : { status: "ready", text: result.text });
  };

  return (
    <Cell cell={cell} empty={!text && !filling}>
      {(headingId) => (
        <>
          <CellHeader cell={cell} headingId={headingId}>
            {editable && !filling && !editing && (
              <Button
                ref={editButton}
                variant="ghost"
                size="sm"
                className={styles.noPrint}
                onClick={() => {
                  setError(undefined);
                  setEditing(true);
                }}
              >
                <Pencil aria-hidden className="size-5" strokeWidth={2} />
                Edytuj<span className="sr-only"> pole: {cell.title}</span>
              </Button>
            )}
          </CellHeader>
          <Question id={questionId}>{cell.question}</Question>

          {editing ? (
            <form
              className="flex grow flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                save(String(new FormData(event.currentTarget).get("text") ?? ""), "author");
              }}
            >
              <Textarea
                name="text"
                defaultValue={text}
                maxLength={CANVAS_TEXT_MAX}
                autoFocus
                aria-labelledby={headingId}
                aria-describedby={error ? `${questionId} ${errorId}` : questionId}
                aria-invalid={error ? true : undefined}
              />
              {error && <FieldError id={errorId}>{error}</FieldError>}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" loading={saving}>
                  Zapisz
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    restoreFocus.current = true;
                    setError(undefined);
                    setEditing(false);
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          ) : filling ? (
            <p className="grow text-muted-foreground">Przygotowuję propozycję…</p>
          ) : text ? (
            <>
              <CellText>{text}</CellText>
              {entry?.source === "ai" && <AiBadge>Propozycja AI</AiBadge>}
            </>
          ) : (
            <>
              <ToFill className="grow" />
              {editable && hint?.status !== "ready" && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("self-start", styles.noPrint)}
                  loading={hint?.status === "loading"}
                  onClick={suggest}
                >
                  {hint?.status !== "loading" && <Sparkles aria-hidden className="size-5" strokeWidth={2} />}
                  Podpowiedz mi<span className="sr-only">: {cell.title}</span>
                </Button>
              )}
              {hint?.status === "loading" && (
                <AiThinking label="Szukam podpowiedzi…" className={cn("w-full", styles.noPrint)} />
              )}
              {hint?.status === "ready" && (
                <AiHint targetType="canvas_hint" targetId={`${ideaId}:${field}`} className={cn("p-4", styles.noPrint)}>
                  <p className="break-words whitespace-pre-line">{hint.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" loading={saving} onClick={() => save(hint.text, "ai")}>
                      Wstaw<span className="sr-only"> do pola: {cell.title}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-current"
                      disabled={saving}
                      onClick={() => {
                        restoreFocus.current = true;
                        setHint(null);
                      }}
                    >
                      Odrzuć
                    </Button>
                  </div>
                </AiHint>
              )}
              {(hint?.status === "error" || error) && (
                <FieldError role="alert" className={styles.noPrint}>
                  {hint?.status === "error" ? hint.error : error}
                </FieldError>
              )}
            </>
          )}
        </>
      )}
    </Cell>
  );
}

function Cell({
  cell,
  empty,
  children,
}: {
  cell: CanvasCell;
  /** Nothing in the cell yet: the dashed „Do uzupełnienia” look. */
  empty: boolean;
  children: (headingId: string) => React.ReactNode;
}) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      style={{ "--column": cell.column, "--row": cell.row } as CSSProperties}
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-lg p-4",
        empty
          ? "border-2 border-dashed border-warning bg-warning-soft"
          : "border border-border bg-card text-card-foreground kontrast:border-2",
        styles.cell,
      )}
    >
      {children(headingId)}
    </section>
  );
}

function CellHeader({
  cell,
  headingId,
  children,
}: {
  cell: CanvasCell;
  headingId: string;
  /** The „Edytuj” control. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-2">
      <h2 id={headingId} className="py-2 text-h4 simple:text-simple-h4">
        {cell.title}
      </h2>
      {children}
    </div>
  );
}

function Question({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-base text-muted-foreground simple:text-simple-base">
      {children}
    </p>
  );
}

function CellText({ children }: { children: React.ReactNode }) {
  return <p className="grow break-words whitespace-pre-line">{children}</p>;
}

function FromCard({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-base simple:text-simple-base", className)}>
      <FileText aria-hidden className="size-5 shrink-0" strokeWidth={2} />Z fiszki
    </span>
  );
}

function ToFill({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 font-bold text-warning", className)}>
      <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" strokeWidth={2} />
      Do uzupełnienia
    </p>
  );
}
