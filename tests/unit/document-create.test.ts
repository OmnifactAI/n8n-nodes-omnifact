import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('Document: Create', () => {
	it('should upload a document with multipart form data', async () => {
		const fileBuffer = Buffer.from('file content');
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				metadata: { values: [] },
			},
			binaryData: {
				data: {
					fileName: 'test.pdf',
					mimeType: 'application/pdf',
					data: '',
				},
			},
			binaryBuffers: { data: fileBuffer },
		});

		const apiResponse = { id: 'doc-1', name: 'test.pdf', status: 'processing' };
		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue(apiResponse);

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toMatchObject(apiResponse);

		const callArgs = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe('omnifactApi');
		const opts = callArgs[1];
		expect(opts.method).toBe('POST');
		expect(opts.url).toContain('spaceId=space-123');
		expect(opts.body).toBeInstanceOf(FormData);
		expect((opts.body as FormData).get('file')).toBeInstanceOf(Blob);
	});

	it('should use file name from binary data', async () => {
		const fileBuffer = Buffer.from('file content');
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				metadata: { values: [] },
			},
			binaryData: {
				data: { fileName: 'original.pdf', mimeType: 'application/pdf', data: '' },
			},
			binaryBuffers: { data: fileBuffer },
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({ id: 'doc-1' });

		await node.execute.call(mock);

		const opts = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(opts.body).toBeInstanceOf(FormData);
		expect(((opts.body as FormData).get('file') as { name?: string }).name).toBe(
			'original.pdf',
		);
	});

	it('should use custom name from additional fields', async () => {
		const fileBuffer = Buffer.from('file content');
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				additionalFields: { name: 'custom-name.pdf' },
				metadata: { values: [] },
			},
			binaryData: {
				data: { fileName: 'original.pdf', mimeType: 'application/pdf', data: '' },
			},
			binaryBuffers: { data: fileBuffer },
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({ id: 'doc-1' });

		await node.execute.call(mock);

		const opts = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(opts.body).toBeInstanceOf(FormData);
		expect(((opts.body as FormData).get('file') as { name?: string }).name).toBe(
			'custom-name.pdf',
		);
	});

	it('should include metadata when provided', async () => {
		const fileBuffer = Buffer.from('file content');
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				metadata: { values: [{ key: 'key', value: 'value' }] },
			},
			binaryData: {
				data: { fileName: 'test.pdf', mimeType: 'application/pdf', data: '' },
			},
			binaryBuffers: { data: fileBuffer },
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({ id: 'doc-1' });

		await node.execute.call(mock);

		const opts = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(opts.body).toBeInstanceOf(FormData);
		expect((opts.body as FormData).get('metadata')).toBe('{"key":"value"}');
	});

	it('should throw helpful error when binary field is missing', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				metadata: { values: [] },
			},
			// No binaryData provided
		});

		await expect(node.execute.call(mock)).rejects.toThrow(
			/Available binary fields: \[\]/,
		);
	});

	it('should return error info when continueOnFail is true and upload fails', async () => {
		const fileBuffer = Buffer.from('file content');
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				metadata: { values: [] },
			},
			binaryData: {
				data: { fileName: 'test.pdf', mimeType: 'application/pdf', data: '' },
			},
			binaryBuffers: { data: fileBuffer },
			continueOnFail: true,
		});

		const apiError = Object.assign(new Error('Bad request'), {
			context: {
				data: {
					code: 'filename_not_unique',
					message: 'Document name must be unique within the space.',
				},
			},
		});
		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(apiError);

		const result = await node.execute.call(mock);

		expect(result[0][0].json).toMatchObject({
			name: 'test.pdf',
			spaceId: 'space-123',
			error: 'filename_not_unique',
			errorMessage: 'Document name must be unique within the space.',
		});
	});

	it('should throw when continueOnFail is false and upload fails', async () => {
		const fileBuffer = Buffer.from('file content');
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				metadata: { values: [] },
			},
			binaryData: {
				data: { fileName: 'test.pdf', mimeType: 'application/pdf', data: '' },
			},
			binaryBuffers: { data: fileBuffer },
			continueOnFail: false,
		});

		const apiError = Object.assign(new Error('Bad request'), {
			context: {
				data: {
					code: 'filename_not_unique',
					message: 'Document name must be unique within the space.',
				},
			},
		});
		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockRejectedValue(apiError);

		await expect(node.execute.call(mock)).rejects.toThrow(
			/Document upload failed: Document name must be unique/,
		);
	});
});
