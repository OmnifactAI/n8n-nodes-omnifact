import { Omnifact } from '../../nodes/Omnifact/Omnifact.node';
import { createMockExecuteFunctions } from '../mocks/mockExecuteFunctions';

const node = new Omnifact();

describe('Operation Dispatch', () => {
	it('should throw for unsupported resources', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'unsupported',
				operation: 'send',
			},
		});

		await expect(node.execute.call(mock)).rejects.toThrow(
			/Unsupported resource "unsupported"/,
		);
	});

	it('should throw for unsupported chat operations', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'chat',
				operation: 'unsupported',
			},
		});

		await expect(node.execute.call(mock)).rejects.toThrow(
			/Unsupported chat operation "unsupported"/,
		);
	});

	it('should throw for unsupported document operations', async () => {
		const mock = createMockExecuteFunctions({
			params: {
				resource: 'document',
				operation: 'unsupported',
			},
		});

		await expect(node.execute.call(mock)).rejects.toThrow(
			/Unsupported document operation "unsupported"/,
		);
	});
});
