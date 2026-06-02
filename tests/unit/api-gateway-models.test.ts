import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('API Gateway: List Models', () => {
	it('should list available models with authentication', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'apiGateway',
				operation: 'models',
			},
		});
		const apiResponse = {
			object: 'list',
			data: [
				{
					id: 'gpt-4o',
					object: 'model',
					created: 1714521600,
					owned_by: 'openai',
				},
			],
		};
		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue(apiResponse);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toMatchObject(apiResponse);
		expect(result[0][0].pairedItem).toEqual({ item: 0 });

		const callArgs = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe('omnifactApi');
		expect(callArgs[1]).toMatchObject({
			method: 'GET',
			url: 'https://connect.omnifact.ai/v1/gateway/models',
			json: true,
		});
	});
});
