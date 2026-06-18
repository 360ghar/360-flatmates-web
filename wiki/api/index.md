# API

The 360 Flatmates web SPA consumes a shared FastAPI backend at `/api/v1`. The canonical contract is [`docs/flatmates-openapi.yaml`](../../docs/flatmates-openapi.yaml): it defines every path, request body, response shape, status code, and enum the backend recognizes, and it is the single source of truth when the SPA and the backend disagree.

This section of the wiki describes how the contract is exposed to the frontend.

- [REST endpoints](rest-endpoints.md): a map of the `/api/v1` endpoint groups, the domain types each group ships, and how the TypeScript client types are regenerated from the OpenAPI spec.

## Related pages

- [API client](../systems/api-client.md) for the `HttpApiClient`, the adapter abstraction, the 401 refresh-and-retry flow, and error normalization.
- [Getting started](../overview/getting-started.md) for the `npm run generate:api-types` command that regenerates `src/lib/api/openapi-types.ts` from the spec.
