import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

const baseChatResponse = {
	id: 'chat-123',
	content: 'Hello world',
	references: { ref1: 'value1' },
	documentParts: [],
	sources: [],
	tokenUsage: { inputTokens: 10, outputTokens: 20 },
};

describe('Chat: Send', () => {
	it('should send a chat message and return JSON output', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'send',
				endpointId: 'ep-123',
				message: 'Hi',
				outputFormat: 'json',
				additionalFields: {},
			},
		});

		(mock.helpers.httpRequest as jest.Mock).mockResolvedValue(baseChatResponse);

		const result = await node.execute.call(mock);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toMatchObject({
			id: 'chat-123',
			content: 'Hello world',
			tokenUsage: { inputTokens: 10, outputTokens: 20 },
		});

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.method).toBe('POST');
		expect(callArgs.url).toContain('/v1/endpoints/ep-123/chat');
		expect(callArgs.body.messages[0].content).toBe('Hi');
	});

	it('should return markdown with inline sources when available', async () => {
		const response = {
			...baseChatResponse,
			sources: [
				{
					documentId: 'doc-1',
					documentName: 'Report.pdf',
					page: 3,
					sourceId: 'src-1',
					sourceType: 'document',
				},
			],
		};

		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'send',
				endpointId: 'ep-123',
				message: 'Hi',
				outputFormat: 'markdown',
				additionalFields: {},
			},
		});

		(mock.helpers.httpRequest as jest.Mock).mockResolvedValue(response);

		const result = await node.execute.call(mock);
		expect(result[0][0].json.text).toContain('Hello world');
		expect(result[0][0].json.text).toContain('[1] Report.pdf, p. 3');
		expect(result[0][0].json.sources).toBeDefined();
	});

	it('should return markdown with document parts when no inline sources', async () => {
		const response = {
			...baseChatResponse,
			documentParts: [{ documentId: 'doc-1', type: 'paragraph', number: 2 }],
		};

		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'send',
				endpointId: 'ep-123',
				message: 'Hi',
				outputFormat: 'markdown',
				additionalFields: {},
			},
		});

		(mock.helpers.httpRequest as jest.Mock).mockResolvedValue(response);

		const result = await node.execute.call(mock);
		expect(result[0][0].json.text).toContain('[1] doc-1 (paragraph 2)');
		expect(result[0][0].json.documentParts).toHaveLength(1);
	});

	it('should send custom headers for additional fields', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'send',
				endpointId: 'ep-123',
				message: 'Hi',
				outputFormat: 'json',
				additionalFields: {
					enableInlineSources: true,
					enableAgenticWorkflow: true,
				},
			},
		});

		(mock.helpers.httpRequest as jest.Mock).mockResolvedValue(baseChatResponse);

		await node.execute.call(mock);

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.headers['omnifact-enable-inline-sources']).toBe('true');
		expect(callArgs.headers['omnifact-enable-agentic-workflow']).toBe('true');
	});

	it('should return error json when continueOnFail is true', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'send',
				endpointId: 'ep-123',
				message: 'Hi',
				outputFormat: 'json',
				additionalFields: {},
			},
			continueOnFail: true,
		});

		(mock.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('API error'));

		const result = await node.execute.call(mock);
		expect(result[0][0].json.error).toBe('API error');
	});

	it('should throw NodeOperationError when continueOnFail is false', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'send',
				endpointId: 'ep-123',
				message: 'Hi',
				outputFormat: 'json',
				additionalFields: {},
			},
			continueOnFail: false,
		});

		(mock.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('API error'));

		await expect(node.execute.call(mock)).rejects.toThrow();
	});
});
