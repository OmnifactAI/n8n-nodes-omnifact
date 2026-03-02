import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('Document: Delete', () => {
	it('should call DELETE and return { deleted: true }', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'delete',
				documentId: 'doc-123',
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({});

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toEqual({ deleted: true });

		const callArgs = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe('omnifactApi');
		const opts = callArgs[1];
		expect(opts.method).toBe('DELETE');
		expect(opts.url).toContain('/v1/documents/doc-123');
	});
});
