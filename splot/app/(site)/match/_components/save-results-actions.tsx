"use client";

import { useState } from "react";
import { Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedSubmission } from "../actions";
import { SaveDialog, type SaveIntent } from "./save-dialog";

/** The results screen's action bar: „Zapisz wyniki” and „Wyślij mi na e-mail”. */
export function SaveResultsActions({
  conversationId,
  onSaved,
}: {
  conversationId: string;
  onSaved: (saved: SavedSubmission) => void;
}) {
  const [intent, setIntent] = useState<SaveIntent>("save");
  const [dialogOpen, setDialogOpen] = useState(false);

  function open(next: SaveIntent) {
    setIntent(next);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => open("save")}>
        <Save aria-hidden strokeWidth={2} />
        Zapisz wyniki
      </Button>
      <Button variant="outline" onClick={() => open("email")}>
        <Mail aria-hidden strokeWidth={2} />
        Wyślij mi na e-mail
      </Button>
      <SaveDialog
        conversationId={conversationId}
        intent={intent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={onSaved}
      />
    </div>
  );
}
