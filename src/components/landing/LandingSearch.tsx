import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";

const POPULAR_SEARCHES = ["Gurugram", "Bangalore", "Koramangala", "Indiranagar"];

export function LandingSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/discover");
  };

  return (
    <div className="w-full">
      <form onSubmit={submit} role="search">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-cut-md bg-surface px-4 text-body-md text-ink-2 shadow-xs focus-within:shadow-[0_0_0_2px_var(--color-accent)]">
            <MapPin className="h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
            <span className="sr-only">Search location</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-body-lg text-ink outline-none focus-visible:outline-none placeholder:text-ink-3"
              placeholder="City, society or locality"
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            className="sm:min-w-[8rem]"
            leadingIcon={<Search className="h-5 w-5" aria-hidden="true" />}
          >
            Search
          </Button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-body-md text-ink-3">Popular:</span>
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
            className="min-h-11 rounded-cut-sm px-2.5 text-body-md font-semibold text-ink-2 transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
