# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n8n community node package for the Omnifact API. Package name: `n8n-nodes-omnifact`. The node is **programmatic** (single `execute()` with manual dispatch), not declarative — keep it that way; don't convert operations to declarative `routing`.

API base URL: `https://connect.omnifact.ai`. Auth is an `X-API-Key` header via the `omnifactApi` credential. The **Chat** resource is unauthenticated (per-endpoint URLs); credentials are only required for the **API Gateway** and **Document** resources (enforced via `displayOptions` on the credentials entry in `Omnifact.node.ts`).

## Commands

```bash
npm run dev          # Launch n8n with node loaded (hot reload)
npm run build        # Compile to dist/ (n8n-node build)
npm run lint         # n8n-node lint
npm run lint:fix
npm test             # Jest, all tests
npm test -- chat-send                       # Single test file by name match
npx jest tests/unit/document-create.test.ts # Single test file by path
npm run test:watch
npm run test:coverage
```

Verify substantive changes with `npm run lint`, `npm run build`, and `npm test`.

## Architecture

Two parallel chains, both rooted in `nodes/Omnifact/Omnifact.node.ts`:

1. **UI descriptions**: `Omnifact.node.ts` `properties` spreads each resource's `resources/<resource>/index.ts`, which defines the Operation selector and spreads each `<operation>/description.ts` (`INodeProperties[]` scoped via `displayOptions`).
2. **Execution**: `Omnifact.node.ts` `execute()` loops items, dispatching per resource to `resources/<resource>/execute.ts`, which dispatches per operation to `<operation>/execute.ts` (`executeX.call(this, itemIndex)` returning `INodeExecutionData[]`).

```
nodes/Omnifact/resources/
├── apiGateway/   # chatCompletion, models — OpenAI-compatible gateway (/v1/gateway/...)
├── chat/         # send — unauthenticated /v1/endpoints/{endpointId}/chat
│   └── types.ts  # OmnifactChatResponse, inline sources / document parts
└── document/     # create, delete, get, getAll, update — /v1/documents
    ├── types.ts  # MultipartRequestBody
    └── utils.ts  # toExecutionData() helper
```

**Adding an operation**: create `<resource>/<newOp>/description.ts` + `execute.ts`, register in the resource's `index.ts` (Operation options + spread) and `execute.ts` (dispatch). **Adding a resource**: also register in `Omnifact.node.ts` — Resource options, properties spread, execute dispatch, and the credentials `displayOptions` list if authenticated.

Error handling lives in the main `execute()` loop: per-item try/catch, `continueOnFail()` returns `{ error: message }` items, otherwise wraps in `NodeOperationError` with `itemIndex`. Operation files throw; document `create` additionally shapes upload errors itself (extracts `error.context.data.code/message`).

### Notable implementation details

- **Document create (file upload)** uses the platform `FormData`/`Blob` API (required for n8n Cloud), not the legacy `form-data` package — n8n's request body type doesn't know this, hence the `MultipartRequestBody` cast in `document/types.ts`.
- **Pagination** (document getAll) is offset-based: page size 100, response shape `{ items, total }`, respects `returnAll`/`limit`.
- **Chat send** formats responses via pure functions `formatInlineSourcesAsMarkdown` / `formatDocumentPartsAsMarkdown` (in `chat/send/execute.ts`), re-exported from `Omnifact.node.ts` so tests can import them directly. Inline sources / agentic workflow are toggled via `omnifact-enable-*` request headers.
- Credential test request hits `GET /v1/documents/supported-file-types`.

## Testing

Jest + ts-jest; tests in `tests/unit/*.test.ts`, mock factory at `tests/mocks/mockExecuteFunctions.ts` (`createMockExecuteFunctions({ params, items, continueOnFail, binaryData, binaryBuffers, paramsByItem })`). Call operations via `node.execute.call(mockFns)` or the operation's `executeX.call(mockFns, itemIndex)`, then assert on HTTP call args (method, URL, body) and output shape.

What to cover per change: HTTP method/URL/body, output shape, pagination/limit edge cases, `continueOnFail()` true (error json) vs false (throws `NodeOperationError`). Test pure formatters directly without mocks.

## Code Standards

- TypeScript strict mode; tabs, single quotes, 100-char width (Prettier).
- HTTP only via `this.helpers.httpRequest()` / `httpRequestWithAuthentication.call(this, 'omnifactApi', options)` — never axios/fetch/got.
- Always preserve item pairing: `constructExecutionMetaData` (document ops use the `toExecutionData` helper).
- Never mutate input data; no external runtime dependencies; no env vars or filesystem access in node code.
- Import runtime values (`NodeConnectionTypes`, `NodeOperationError`) separately from types (`import type {...}`).
- Reuse field `value` strings across operations so user data persists when switching operations.

### n8n UI rules

- Title Case for `displayName` / option `name`; sentence case for `description`, `action`, `hint`.
- Boolean descriptions start with "Whether..."; placeholders start with "e.g. ...".
- Operation `action` includes the resource name ("Create a document").
- Field order: Resource → Operation → required fields → `Additional Fields` collection (`placeholder: 'Add Field'`).
- `noDataExpression: true` on `resource` and `operation` params.
- Delete ops return `[{ deleted: true }]`. CRUD naming: Create, Get, Get Many, Update, Delete.

## Package constraints

`package.json` must keep: name prefixed `n8n-nodes-`, keyword `n8n-community-node-package`, `files: ["dist"]`, `n8n-workflow` in `peerDependencies` only (it's also in devDependencies for test imports — that's intentional), `n8n.strict: true`, `n8n.nodes`/`n8n.credentials` pointing at `dist/` paths.

## Publishing

Pushing a version tag (`*.*.*`) triggers `.github/workflows/publish.yml`, which runs `npm run release` with npm OIDC trusted publishing (provenance required for n8n verification from May 2026). Don't publish locally.
