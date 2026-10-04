import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm() {
  return (
    <form action="/library" method="get" role="search" className="flex flex-col gap-3">
      <label htmlFor="home-search" className="text-h4 simple:text-simple-h4">
        Szukaj w bibliotece innowacji
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="home-search"
          name="q"
          type="search"
          placeholder="Np. seniorzy, samotność, cyfryzacja"
          className="flex-1"
        />
        <Button type="submit" className="simple:w-full">
          <Search aria-hidden />
          Szukaj
        </Button>
      </div>
    </form>
  );
}
