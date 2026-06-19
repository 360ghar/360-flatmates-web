import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ZodType } from "zod";
import { apiClient } from "@/lib/api";
import type { FlatmatesBootstrap } from "@/lib/api/types";
import { flatmatesBootstrapSchema } from "@/lib/schemas";

/**
 * Pilot helper (F10 #30): validate an API response with a Zod schema before
 * returning it. Centralising the parse here lets us swap in a logger /
 * Sentry breadcrumb without touching every call site.
 *
 * If the response is malformed, we throw — TanStack Query will surface this
 * as an error to consumers. The contract is that the wire shape and the Zod
 * schema must agree; this is the second line of defence behind OpenAPI
 * codegen.
 */
export async function validateApiResponse<T>(
  response: T,
  schema: ZodType<T>
): Promise<T> {
  const parsed = schema.safeParse(response);
  if (!parsed.success) {
    throw new Error(
      `API response failed schema validation: ${parsed.error.message}`
    );
  }
  return parsed.data;
}

export const bootstrapOptions = queryOptions({
  queryKey: ["bootstrap"],
  queryFn: async () => {
    const raw = await apiClient.request<FlatmatesBootstrap>({
      method: "GET",
      path: "/flatmates/bootstrap"
    });
    return validateApiResponse(raw, flatmatesBootstrapSchema);
  },
  staleTime: 5 * 60 * 1000
});

export function useBootstrap() {
  return useQuery(bootstrapOptions);
}
