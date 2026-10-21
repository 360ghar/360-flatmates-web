import { Trash2, Search, Pencil, Copy, Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { humanizeSnakeCase, toTitleCase } from "@/lib/utils/format";
import type { SearchFilters, SavedSearch } from "@/lib/api/types";

/** Render a single filter value as a human-readable chip. */
function formatFilterValue(key: string, value: unknown): string {
  const humanKey = toTitleCase(humanizeSnakeCase(key));
  if (Array.isArray(value)) {
    if (value.length === 0) return humanKey;
    const items = value.map((v) => toTitleCase(humanizeSnakeCase(String(v)))).join(", ");
    return `${humanKey}: ${items}`;
  }
  if (typeof value === "number") {
    return `${humanKey}: ${value}`;
  }
  if (typeof value === "boolean") {
    return `${humanKey}: ${value ? "yes" : "no"}`;
  }
  const str = String(value ?? "").trim();
  if (!str) return humanKey;
  return `${humanKey}: ${str}`;
}

export function SavedSearchRow({
  search,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onCommitRename,
  onCancelRename,
  onBeginRename,
  onRerun,
  onClone,
  onSaveAsAlert,
  onRequestDelete,
  renamePending,
  clonePending,
  cloneIsThisRow,
  deletePending,
  deleteIsThisRow
}: {
  search: SavedSearch;
  isRenaming: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onBeginRename: (id: number, currentName: string) => void;
  onRerun: (filters: SearchFilters) => void;
  onClone: (id: number) => void;
  onSaveAsAlert: (filters: SearchFilters) => void;
  onRequestDelete: (id: number) => void;
  renamePending: boolean;
  clonePending: boolean;
  cloneIsThisRow: boolean;
  deletePending: boolean;
  deleteIsThisRow: boolean;
}) {
  const activeFilters = Object.entries(search.filters).reduce<string[]>(
    (acc, [key, value]) => {
      if (value === undefined || value === null || value === "") return acc;
      if (Array.isArray(value) && value.length === 0) return acc;
      acc.push(formatFilterValue(key, value));
      return acc;
    },
    []
  );

  return (
    <Card
      as="li"
      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isRenaming ? (
            <Input
              aria-label={`Rename saved search ${search.name}`}
              value={renameValue}
              autoFocus
              onChange={(e) => onRenameValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCommitRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  onCancelRename();
                }
              }}
              className="max-w-xs"
            />
          ) : (
            <>
              <h2 className="text-body-md font-semibold text-ink truncate">{search.name}</h2>
              {search.alert_enabled && (
                <Chip variant="info" selected>Alert On</Chip>
              )}
            </>
          )}
        </div>
        {activeFilters.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {activeFilters.slice(0, 3).map((filter) => (
              <Chip key={filter} variant="info">{filter}</Chip>
            ))}
            {activeFilters.length > 3 && (
              <Chip variant="info">+{activeFilters.length - 3}</Chip>
            )}
          </div>
        )}
        {search.new_results_count !== undefined && search.new_results_count > 0 && (
          <p className="text-caption text-accent mt-1">
            {search.new_results_count} new results
          </p>
        )}
      </div>
      <div
        className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto"
        role="group"
        aria-label={`Actions for ${search.name}`}
      >
        {isRenaming ? (
          <>
            <Button
              variant="icon"
              size="icon"
              aria-label="Confirm rename"
              disabled={!renameValue.trim() || renamePending}
              loading={renamePending}
              onClick={onCommitRename}
            >
              <Check aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              aria-label="Cancel rename"
              disabled={renamePending}
              onClick={onCancelRename}
            >
              <X aria-hidden="true" className="h-4 w-4 text-ink-3" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="icon"
              size="icon"
              aria-label={`Run search: ${search.name}`}
              onClick={() => onRerun(search.filters)}
            >
              <Search aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              aria-label={`Rename saved search: ${search.name}`}
              onClick={() => onBeginRename(search.id, search.name)}
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              aria-label={`Duplicate saved search: ${search.name}`}
              onClick={() => onClone(search.id)}
              disabled={clonePending}
              loading={clonePending && cloneIsThisRow}
            >
              <Copy aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              aria-label={`Create alert from saved search: ${search.name}`}
              onClick={() => onSaveAsAlert(search.filters)}
            >
              <Bell aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              aria-label={`Delete saved search: ${search.name}`}
              onClick={() => onRequestDelete(search.id)}
              loading={deletePending && deleteIsThisRow}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
