import type { INodeProperties } from 'n8n-workflow';

export const getAllDescription: INodeProperties[] = [
	{
		displayName: 'Space ID',
		name: 'spaceId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345678-abcd-1234-abcd-123456789abc',
		description: 'The UUID of the space to list documents from',
		displayOptions: { show: { resource: ['document'], operation: ['getAll'] } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['document'], operation: ['getAll'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		description: 'Max number of results to return',
		displayOptions: {
			show: { resource: ['document'], operation: ['getAll'], returnAll: [false] },
		},
	},
];
