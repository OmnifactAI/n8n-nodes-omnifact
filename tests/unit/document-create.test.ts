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
				additionalFields: {},
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
		expect(opts.headers['Content-Type']).toBe('multipart/form-data');
		expect(opts.body.file.value).toBe(fileBuffer);
		expect(opts.body.file.options.filename).toBe('test.pdf');
	});

	it('should use custom name from additional fields', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				additionalFields: { name: 'custom-name.pdf' },
			},
			binaryData: {
				data: { fileName: 'original.pdf', mimeType: 'application/pdf', data: '' },
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({ id: 'doc-1' });

		await node.execute.call(mock);

		const opts = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(opts.body.file.options.filename).toBe('custom-name.pdf');
	});

	it('should include metadata when provided', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'create',
				spaceId: 'space-123',
				binaryPropertyName: 'data',
				additionalFields: { metadata: '{"key":"value"}' },
			},
			binaryData: {
				data: { fileName: 'test.pdf', mimeType: 'application/pdf', data: '' },
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({ id: 'doc-1' });

		await node.execute.call(mock);

		const opts = (mock.helpers.httpRequestWithAuthentication as jest.Mock).mock.calls[0][1];
		expect(opts.body.metadata).toBe('{"key":"value"}');
	});
});
