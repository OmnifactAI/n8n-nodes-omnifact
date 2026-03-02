# n8n-nodes-omnifact

This is an n8n community node for the [Omnifact](https://omnifact.ai) API.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-omnifact`
4. Agree to the risks and select **Install**

## Credentials

The **Document** resource requires an Omnifact API key. Configure it via the **Omnifact API** credential:

1. Go to **Credentials** in n8n
2. Select **Add Credential** and search for **Omnifact API**
3. Enter your API key (available from your Omnifact workspace settings)

The **Chat** resource uses unauthenticated endpoint URLs and does not require credentials.

## Resources

### Chat

- **Send** — Send a message to an Omnifact chat endpoint

### Document

- **Create** — Upload a document to a space
- **Delete** — Delete a document by ID
- **Get** — Retrieve a document by ID
- **Get Many** — List documents in a space (with pagination)
- **Update** — Rename a document

## Development

```bash
npm install          # Install dependencies
npm run dev          # Launch n8n with the node loaded (hot reload)
npm run build        # Compile to dist/
npm run lint         # Check lint
npm run lint:fix     # Auto-fix lint issues
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Compatibility

Tested with n8n v2.9.4. Requires n8n community node support (available in n8n v0.187+).

## License

[MIT](LICENSE)
