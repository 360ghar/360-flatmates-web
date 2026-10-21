import type { components } from "./openapi-types";

export type { components, paths } from "./openapi-types";

/** Every schema in the backend OpenAPI snapshot (`openapi/openapi.json`). */
export type Schemas = components["schemas"];

/**
 * Request body type: the generated type marks a field with a server default as
 * required, but a client may leave it out. `K` names those fields.
 */
export type WriteBody<T, K extends keyof T = never> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Read an enum value from the wire. Returns the value when it is one of
 * `values`, else `null`. An unknown value never falls back to a real value.
 */
export function readEnum<const T extends readonly string[]>(
  values: T,
  raw: unknown
): T[number] | null {
  return typeof raw === "string" && (values as readonly string[]).includes(raw)
    ? (raw as T[number])
    : null;
}

/** {@link readEnum} for a list, such as a hand-edited URL: keeps the known values and drops the rest. */
export function readEnumList<const T extends readonly string[]>(
  values: T,
  raw: readonly string[]
): Array<T[number]> {
  return raw.filter((value): value is T[number] => (values as readonly string[]).includes(value));
}
