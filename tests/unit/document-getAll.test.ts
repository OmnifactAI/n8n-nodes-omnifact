import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('Document: Get Many', () => {
	it('should return a single page of results', async () => {
		const items = [
			{ id: 'doc-1', name: 'a.pdf' },
			{ id: 'doc-2', name: 'b.pdf' },
		];
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'getAll',
				spaceId: 'space-123',
				returnAll: true,
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({
			items,
			total: 2,
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(2);
		expect(result[0][0].json.id).toBe('doc-1');
	});

	it('should paginate across multiple pages when returnAll is true', async () => {
		const page1 = Array.from({ length: 100 }, (_, i) => ({ id: `doc-${i}` }));
		const page2 = [{ id: 'doc-100' }, { id: 'doc-101' }];

		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'getAll',
				spaceId: 'space-123',
				returnAll: true,
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock)
			.mockResolvedValueOnce({ items: page1, total: 102 })
			.mockResolvedValueOnce({ items: page2, total: 102 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(102);
		expect(mock.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
	});

	it('should respect the limit parameter', async () => {
		const items = Array.from({ length: 100 }, (_, i) => ({ id: `doc-${i}` }));

		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'getAll',
				spaceId: 'space-123',
				returnAll: false,
				limit: 5,
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({
			items,
			total: 100,
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(5);
	});

	it('should handle empty response', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'getAll',
				spaceId: 'space-123',
				returnAll: true,
			},
		});

		(mock.helpers.httpRequestWithAuthentication as jest.Mock).mockResolvedValue({
			items: [],
			total: 0,
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(0);
	});
});
