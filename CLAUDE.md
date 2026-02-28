# n8n Community Node: Omnifact

## Project Overview

n8n community node package for the Omnifact API. Package name: `n8n-nodes-omnifact`.

## Project Structure

```
n8n-nodes-omnifact/
├── credentials/
│   └── OmnifactApi.credentials.ts
├── nodes/
│   └── Omnifact/
│       ├── Omnifact.node.ts          # Main node file (class name = filename)
│       ├── Omnifact.node.json        # Codex metadata
│       ├── omnifact.svg              # Light icon
│       ├── omnifact.dark.svg         # Dark icon
│       ├── resources/
│       │   └── <resourceName>/
│       │       ├── index.ts          # INodeProperties[] for this resource
│       │       ├── create.ts
│       │       ├── get.ts
│       │       └── getAll.ts
│       └── shared/
│           ├── descriptions.ts       # Shared field definitions
│           └── transport.ts          # HTTP helper functions
├── icons/
│   ├── omnifact.svg
│   └── omnifact.dark.svg
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── .prettierrc.js
```

## package.json

Required fields:
- `name`: must start with `n8n-nodes-`
- `keywords`: must include `"n8n-community-node-package"`
- `n8n.n8nNodesApiVersion`: `1`
- `n8n.strict`: `true`
- `n8n.credentials`: array of `dist/` paths to credential files
- `n8n.nodes`: array of `dist/` paths to node files
- `files`: `["dist"]`
- `peerDependencies`: `{ "n8n-workflow": "*" }` (NOT a regular dep)
- `devDependencies`: `@n8n/node-cli`, `eslint`, `prettier`, `typescript`

Scripts:
```json
{
  "build": "n8n-node build",
  "dev": "n8n-node dev",
  "lint": "n8n-node lint",
  "lint:fix": "n8n-node lint --fix",
  "release": "n8n-node release",
  "prepublishOnly": "n8n-node prerelease"
}
```

## Choosing Node Style

**Declarative** (preferred): REST APIs, config-driven routing, no `execute()` method needed. Simpler, less error-prone, more future-proof.

**Programmatic** (when required): trigger nodes, GraphQL, external npm deps, complex data transforms, full versioning.

## Declarative Node Anatomy

```typescript
import { NodeConnectionTypes } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Omnifact implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Omnifact',               // Title Case
    name: 'omnifact',                      // camelCase, unique
    icon: { light: 'file:omnifact.svg', dark: 'file:omnifact.dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Omnifact API',  // Sentence case
    defaults: { name: 'Omnifact' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'omnifactApi', required: true }],
    requestDefaults: {
      baseURL: 'https://api.omnifact.ai',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    },
    properties: [
      // Resource selector (always first)
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,          // REQUIRED on resource
        options: [{ name: 'MyResource', value: 'myResource' }],
        default: 'myResource',
      },
      // Operation selector (per resource via displayOptions)
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,          // REQUIRED on operation
        displayOptions: { show: { resource: ['myResource'] } },
        options: [
          {
            name: 'Get',
            value: 'get',
            action: 'Get a resource',    // Sentence case, include resource name
            routing: {
              request: { method: 'GET', url: '/v1/resources/{{$parameter.resourceId}}' },
            },
          },
        ],
        default: 'get',
      },
      // ...spread resource descriptions
    ],
  };
}
```

### Routing on fields

```typescript
// Send field value in request body
routing: { send: { type: 'body', property: 'title' } }

// Send in query string
routing: { send: { type: 'query', property: 'per_page' } }

// Transform value in qs
routing: { request: { qs: { date: '={{ new Date($value).toISOString().substr(0,10) }}' } } }
```

## Programmatic Node Anatomy

```typescript
import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Omnifact implements INodeType {
  description: INodeTypeDescription = { /* same as declarative minus requestDefaults/routing */ };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'myResource') {
          if (operation === 'get') {
            const id = this.getNodeParameter('resourceId', i) as string;
            const options: IHttpRequestOptions = {
              method: 'GET',
              url: `https://api.omnifact.ai/v1/resources/${id}`,
              json: true,
            };
            const responseData = await this.helpers.httpRequestWithAuthentication.call(
              this, 'omnifactApi', options,
            );
            const executionData = this.helpers.constructExecutionMetaData(
              this.helpers.returnJsonArray(responseData as IDataObject),
              { itemData: { item: i } },
            );
            returnData.push(...executionData);
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          const executionData = this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray({ error: error.message }),
            { itemData: { item: i } },
          );
          returnData.push(...executionData);
          continue;
        }
        throw error;
      }
    }
    return [returnData];
  }
}
```

## Credentials

```typescript
import type { IAuthenticateGeneric, Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class OmnifactApi implements ICredentialType {
  name = 'omnifactApi';
  displayName = 'Omnifact API';
  icon: Icon = { light: 'file:../icons/omnifact.svg', dark: 'file:../icons/omnifact.dark.svg' };
  documentationUrl = 'https://docs.omnifact.ai';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
  ];
  // Header auth
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
  };
  // Optional test request
  test: ICredentialTestRequest = {
    request: { baseURL: 'https://api.omnifact.ai', url: '/v1/me', method: 'GET' },
  };
}
```

Auth placement variants: `properties.headers`, `properties.qs`, `properties.body`, `properties.auth` (basic).

OAuth2: set `extends = ['oAuth2Api']` and provide hidden fields for `authUrl`, `accessTokenUrl`, `scope`, `grantType`.

## Resource/Operation File Pattern

Each resource gets its own directory under `resources/`:

```typescript
// resources/myResource/index.ts
import type { INodeProperties } from 'n8n-workflow';

export const myResourceDescription: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['myResource'] } },
    options: [
      { name: 'Get', value: 'get', action: 'Get a resource', routing: { request: { method: 'GET', url: '=/v1/resources/{{$parameter.resourceId}}' } } },
      { name: 'Get Many', value: 'getAll', action: 'Get many resources', routing: { request: { method: 'GET', url: '/v1/resources' } } },
    ],
    default: 'get',
  },
  // ...field definitions with displayOptions scoped to this resource+operation
];
```

Main node file spreads them: `properties: [resourceParam, ...myResourceDescription, ...otherResourceDescription]`.

## UI Design Rules

- **Title Case**: `displayName` on nodes, parameters, dropdown option `name`
- **Sentence case**: `description`, `action`, `hint` fields
- **Boolean descriptions**: must start with "Whether..."
- **Placeholders**: start with "e.g. ..."
- **Operation `action`**: must include resource name — "Get issues in a repository"
- **Field ordering**: Resource > Operation > required fields > Additional Fields collection
- **`noDataExpression: true`**: required on `resource` and `operation` params
- **Optional fields**: group under `Additional Fields` (`type: 'collection'`, `placeholder: 'Add Field'`)
- **Resource Locator**: use `type: 'resourceLocator'` wherever user selects a single external item
- **Simplify param**: add when response has >10 fields
- **Delete ops**: return `[{ deleted: true }]`
- **CRUD naming**: Create, Get, Get Many, Update, Delete, (Create or Update)

### displayOptions

```typescript
displayOptions: { show: { resource: ['myResource'], operation: ['create'] } }
```

## Pagination (returnAll / limit)

### Declarative (Link header)

```typescript
// On the "Return All" boolean:
{
  displayName: 'Return All',
  name: 'returnAll',
  type: 'boolean',
  default: false,
  displayOptions: { show: { resource: ['myResource'], operation: ['getAll'] } },
  description: 'Whether to return all results or only up to a given limit',
  routing: { send: { paginate: '={{ $value }}' } },
}
// On the limit field:
{
  displayName: 'Limit',
  name: 'limit',
  type: 'number',
  default: 50,
  typeOptions: { minValue: 1 },
  displayOptions: { show: { resource: ['myResource'], operation: ['getAll'], returnAll: [false] } },
  description: 'Max number of results to return',
  routing: {
    send: { type: 'query', property: 'per_page', value: '100' },
    output: { maxResults: '={{$value}}' },
  },
}
// Pagination config on the operation:
routing: {
  request: { method: 'GET', url: '/v1/resources' },
  operations: {
    pagination: {
      type: 'generic',
      properties: {
        continue: '={{ !!parseLinkHeader($response.headers?.link).next }}',
        request: { url: '={{ parseLinkHeader($response.headers?.link)?.next ?? $request.url }}' },
      },
    },
  },
}
```

### Programmatic

Loop with offset/cursor, push results into array, respect `returnAll` / `limit` params.

## Node Codex File

```json
{
  "node": "n8n-nodes-base.omnifact",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Development"],
  "resources": {
    "primaryDocumentation": [{ "url": "https://github.com/org/repo" }],
    "credentialDocumentation": [{ "url": "https://docs.omnifact.ai/auth" }]
  }
}
```

Categories: `Data & Storage`, `Finance & Accounting`, `Marketing & Content`, `Productivity`, `Miscellaneous`, `Sales`, `Development`, `Analytics`, `Communication`, `Utility`.

## Icons

- Provide SVG pair: `omnifact.svg` (light) and `omnifact.dark.svg` (dark)
- Reference: `icon: { light: 'file:omnifact.svg', dark: 'file:omnifact.dark.svg' }`
- Place in node directory and/or `icons/` directory (credentials reference `../icons/`)

## Code Standards

- **TypeScript strict mode** (`tsconfig.json` has `strict: true`)
- **Class name must match filename** — `Omnifact` class in `Omnifact.node.ts`
- **HTTP requests**: only `this.helpers.httpRequest()` or `this.helpers.httpRequestWithAuthentication()` — never axios/fetch/got
- **Never mutate input data** — clone first
- **Always include paired item data** via `constructExecutionMetaData` or `pairedItem`
- **Error handling**: `NodeOperationError(this.getNode(), error, { itemIndex })` + `continueOnFail()` guard
- **Reuse field `value` strings** across operations so data persists when user switches
- **No external npm dependencies** for verified nodes
- **No env var or filesystem access**
- **ESLint**: `eslint.config.mjs` exports `config` from `@n8n/node-cli/eslint`
- **Prettier**: tabs, single quotes, trailing commas, 100 char width, LF line endings

## Key TypeScript Imports

```typescript
// Values
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Types
import type {
  INodeType, INodeTypeDescription, INodeProperties, INodePropertyOptions,
  IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, IDataObject,
  IHttpRequestOptions, IHttpRequestMethods,
  ICredentialType, IAuthenticateGeneric, ICredentialTestRequest, Icon,
  INodeListSearchItems, INodeListSearchResult,
} from 'n8n-workflow';
```

## Config Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true, "module": "commonjs", "moduleResolution": "node",
    "target": "es2019", "lib": ["es2019", "es2020", "es2022.error"],
    "removeComments": true, "useUnknownInCatchVariables": false,
    "forceConsistentCasingInFileNames": true, "noImplicitAny": true,
    "noImplicitReturns": true, "noUnusedLocals": true, "strictNullChecks": true,
    "preserveConstEnums": true, "esModuleInterop": true, "resolveJsonModule": true,
    "incremental": true, "declaration": true, "sourceMap": true,
    "skipLibCheck": true, "outDir": "./dist/"
  },
  "include": ["credentials/**/*", "nodes/**/*", "nodes/**/*.json", "package.json"]
}
```

### eslint.config.mjs
```js
import { config } from '@n8n/node-cli/eslint';
export default config;
```

### .prettierrc.js
```js
module.exports = {
  semi: true, trailingComma: 'all', bracketSpacing: true, useTabs: true,
  tabWidth: 2, arrowParens: 'always', singleQuote: true, quoteProps: 'as-needed',
  endOfLine: 'lf', printWidth: 100,
};
```

## Dev Workflow

```bash
npm install          # Install deps
npm run dev          # Launch n8n with node loaded (hot reload)
npm run build        # Compile to dist/
npm run lint         # Check lint
npm run lint:fix     # Auto-fix lint issues
```

## Publishing

1. `npm run build`
2. `npm publish`
3. Ensure: name starts with `n8n-nodes-`, keyword `n8n-community-node-package`, MIT license, `peerDependencies: { "n8n-workflow": "*" }`

## Verification Checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm run dev` launches n8n with node loaded
- [ ] Node appears in n8n editor with correct icon, name, credentials
- [ ] Credentials test request succeeds
- [ ] All operations return properly structured `INodeExecutionData[][]`
