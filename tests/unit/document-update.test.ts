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

	it('should include multiple metadata fields in the PATCH body', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'update',
				documentId: 'doc-123',
				name: 'new-name.pdf',
				metadata: {
					values: [
						{ key: 'department', value: 'Legal' },
						{ key: 'region', value: 'EU' },
					],
				},
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({
			id: 'doc-123',
		});

		await node.execute.call(mock);

		const opts = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(opts.body).toEqual({
			name: 'new-name.pdf',
			metadata: {
				department: 'Legal',
				region: 'EU',
			},
		});
	});

	it('should return error json when continueOnFail is true', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'update',
				documentId: 'doc-123',
				name: 'new-name.pdf',
			},
			continueOnFail: true,
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(
			new Error('Update failed'),
		);

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toEqual({ error: 'Update failed' });
		expect(result[0][0].pairedItem).toEqual({ item: 0 });
	});

	it('should throw when continueOnFail is false', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'update',
				documentId: 'doc-123',
				name: 'new-name.pdf',
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(
			new Error('Update failed'),
		);

		await expect(node.execute.call(mock)).rejects.toThrow(/Update failed/);
	});
});
