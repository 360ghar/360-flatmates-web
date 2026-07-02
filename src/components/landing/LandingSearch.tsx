import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";

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
    <div className="w-full max-w-3xl">
      <form
        onSubmit={submit}
        className="rounded-[22px] border-[1.5px] border-ink bg-surface p-2 shadow-lg"
        role="search"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-14 flex-1 items-center gap-3 rounded-[16px] bg-paper px-4 text-body-md text-ink-2">
            <MapPin className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <span className="sr-only">Search location</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-body-lg text-ink outline-none placeholder:text-ink-3"
              placeholder="Search city, society, locality"
              autoComplete="off"
            />
          </label>
          <Button
            type="submit"
            variant="highlight"
            size="tall"
            className="min-h-14 rounded-[16px] px-5 normal-case tracking-normal"
            leadingIcon={<Search className="h-5 w-5" aria-hidden="true" />}
          >
            Search
          </Button>
        </div>
        <div className="mt-2 grid gap-2 rounded-[16px] bg-ink px-4 py-3 text-white sm:grid-cols-3">
          <span className="flex items-center gap-2 text-caption text-white/82">
            <ShieldCheck className="h-4 w-4 text-action" aria-hidden="true" />
            Verified rooms
          </span>
          <span className="flex items-center gap-2 text-caption text-white/82">
            <Sparkles className="h-4 w-4 text-action" aria-hidden="true" />
            Compatibility first
          </span>
          <span className="text-caption text-white/82">Visit scheduling built in</span>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-body-md text-ink-3">Popular:</span>
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-body-md text-ink-2 shadow-xs transition-colors hover:border-accent/30 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
