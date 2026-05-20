import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('Document: Get', () => {
	it('should GET a document by ID', async () => {
		const apiResponse = { id: 'doc-123', name: 'test.pdf', status: 'ready' };
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'get',
				documentId: 'doc-123',
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue(apiResponse);

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toMatchObject(apiResponse);

		const callArgs = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe('omnifactApi');
		const opts = callArgs[1];
		expect(opts.method).toBe('GET');
		expect(opts.url).toContain('/v1/documents/doc-123');
	});

	it('should return error json when continueOnFail is true', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'get',
				documentId: 'doc-123',
			},
			continueOnFail: true,
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(
			new Error('Get failed'),
		);

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toEqual({ error: 'Get failed' });
		expect(result[0][0].pairedItem).toEqual({ item: 0 });
	});

	it('should throw when continueOnFail is false', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'get',
				documentId: 'doc-123',
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(
			new Error('Get failed'),
		);

		await expect(node.execute.call(mock)).rejects.toThrow(/Get failed/);
	});
});
