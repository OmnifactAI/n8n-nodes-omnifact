import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('Document: Update', () => {
	it('should PATCH a document with the new name', async () => {
		const apiResponse = { id: 'doc-123', name: 'new-name.pdf' };
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'update',
				documentId: 'doc-123',
				name: 'new-name.pdf',
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue(apiResponse);

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toMatchObject(apiResponse);

		const callArgs = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe('omnifactApi');
		const opts = callArgs[1];
		expect(opts.method).toBe('PATCH');
		expect(opts.url).toContain('/v1/documents/doc-123');
		expect(opts.body).toEqual({ name: 'new-name.pdf' });
	});
});
