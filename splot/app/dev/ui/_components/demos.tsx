"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tag } from "@/components/ui/tag";
import { toast } from "@/components/ui/toast";

const FILTERS = ["Samotność", "Starzenie się", "Wykluczenie cyfrowe"];

export function TagDemo() {
  const [selected, setSelected] = useState(["Samotność"]);

  const toggle = (filter: string) =>
    setSelected((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Tag key={filter} selected={selected.includes(filter)} onClick={() => toggle(filter)}>
            {filter}
          </Tag>
        ))}
        <Tag icon={<MapPin aria-hidden />}>Z ikoną</Tag>
        <Tag disabled>Niedostępny</Tag>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((filter) => (
          <Tag key={filter} onRemove={() => toggle(filter)}>
            {filter}
          </Tag>
        ))}
      </div>
    </div>
  );
}

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toast({ tone: "success", title: "Zapisano fiszkę", description: "Możesz do niej wrócić w każdej chwili." })
        }
      >
        Sukces (znika po 8 s)
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: "info",
            title: "Nowe zgłoszenie",
            description: "SPL-2026-0142 · Brak transportu do lekarza",
            action: { label: "Otwórz zgłoszenie", href: "#main-content" },
          })
        }
      >
        Z akcją (zostaje)
      </Button>
      <Button variant="outline" onClick={() => toast({ tone: "warning", title: "Nabór kończy się jutro" })}>
        Ostrzeżenie
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            tone: "error",
            title: "Nie udało się zapisać",
            action: { label: "Spróbuj ponownie", onClick: () => {} },
          })
        }
      >
        Błąd
      </Button>
    </div>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Otwórz okno</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunąć fiszkę?</DialogTitle>
          <DialogDescription>Tej operacji nie można cofnąć.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Anuluj</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Usuń fiszkę</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Otwórz panel boczny</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtry</SheetTitle>
          <SheetDescription>Zawęź listę innowacji.</SheetDescription>
        </SheetHeader>
        <TagDemo />
      </SheetContent>
    </Sheet>
  );
}
