import { cn } from "@/lib/utils";

/** Placeholder page for a route its stream has not built yet. */
export function RouteStub({ title, layout = "site" }: { title: string; layout?: "site" | "admin" }) {
  return (
    <main
      id="main-content"
      className={cn(
        "flex flex-col gap-4",
        layout === "site" ? "mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-8" : "p-4 sm:p-8",
      )}
    >
      <h1 className="text-h1 simple:text-simple-h1">{title}</h1>
      <p className="text-lead text-muted-foreground simple:text-simple-lead">Wkrótce</p>
    </main>
  );
}
