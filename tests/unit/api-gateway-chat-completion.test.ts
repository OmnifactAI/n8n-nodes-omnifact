import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

const baseChatCompletionResponse = {
	id: 'chatcmpl-abc123',
	object: 'chat.completion',
	created: 1715000000,
	model: 'gpt-4o',
	choices: [
		{
			index: 0,
			message: {
				role: 'assistant',
				content: 'Hello from the gateway',
			},
			finish_reason: 'stop',
		},
	],
	usage: {
		prompt_tokens: 10,
		completion_tokens: 20,
		total_tokens: 30,
	},
};

describe('API Gateway: Create Chat Completion', () => {
	it('should create a non-streaming chat completion with optional generation fields', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'apiGateway',
				operation: 'chatCompletion',
				model: 'gpt-4o',
				messages: {
					values: [
						{ role: 'system', content: 'You are concise.' },
						{ role: 'user', content: 'Say hello' },
					],
				},
				additionalFields: {
					maxCompletionTokens: 256,
					maxTokens: 128,
					temperature: 0.5,
				},
			},
		});
		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue(
			baseChatCompletionResponse,
		);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toMatchObject(baseChatCompletionResponse);
		expect(result[0][0].pairedItem).toEqual({ item: 0 });

		const callArgs = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe('omnifactApi');
		expect(callArgs[1]).toMatchObject({
			method: 'POST',
			url: 'https://connect.omnifact.ai/v1/gateway/chat/completions',
			json: true,
		});
		expect(callArgs[1].body).toEqual({
			model: 'gpt-4o',
			stream: false,
			messages: [
				{ role: 'system', content: 'You are concise.' },
				{ role: 'user', content: 'Say hello' },
			],
			max_completion_tokens: 256,
			max_tokens: 128,
			temperature: 0.5,
		});
	});

	it('should execute once per input item and preserve paired item metadata', async () => {
		const mock = createMockExecuteFunctions({
			items: [{ json: { row: 1 } }, { json: { row: 2 } }],
			paramsByItem: [
				{
					resource: 'apiGateway',
					operation: 'chatCompletion',
					model: 'gpt-4o',
					messages: { values: [{ role: 'user', content: 'First' }] },
					additionalFields: {},
				},
				{
					resource: 'apiGateway',
					operation: 'chatCompletion',
					model: 'eu/claude-4-6-sonnet',
					messages: { values: [{ role: 'user', content: 'Second' }] },
					additionalFields: {},
				},
			],
		});
		(mock.helpers.httpRequestWithAuthentication as jest.Mock)
			.mockResolvedValueOnce({ ...baseChatCompletionResponse, id: 'chatcmpl-1' })
			.mockResolvedValueOnce({
				...baseChatCompletionResponse,
				id: 'chatcmpl-2',
				model: 'eu/claude-4-6-sonnet',
			});

		const result = await node.execute.call(mock);

		expect(mock.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
		expect((mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1].body).toMatchObject({
			model: 'gpt-4o',
			messages: [{ role: 'user', content: 'First' }],
			stream: false,
		});
		expect((mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[1][1].body).toMatchObject({
			model: 'eu/claude-4-6-sonnet',
			messages: [{ role: 'user', content: 'Second' }],
			stream: false,
		});
		expect(result[0]).toHaveLength(2);
		expect(result[0][0].json.id).toBe('chatcmpl-1');
		expect(result[0][0].pairedItem).toEqual({ item: 0 });
		expect(result[0][1].json.id).toBe('chatcmpl-2');
		expect(result[0][1].pairedItem).toEqual({ item: 1 });
	});
});
