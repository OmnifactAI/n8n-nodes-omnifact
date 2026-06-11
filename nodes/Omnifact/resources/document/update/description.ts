import type { INodeProperties } from 'n8n-workflow';

export const updateDescription: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345678-abcd-1234-abcd-123456789abc',
		description: 'The UUID of the document to update',
		displayOptions: { show: { resource: ['document'], operation: ['update'] } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'The new name for the document',
		displayOptions: { show: { resource: ['document'], operation: ['update'] } },
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {
			values: [],
		},
		displayOptions: { show: { resource: ['document'], operation: ['update'] } },
		placeholder: 'Add Metadata Field',
		description: 'Metadata fields to update on the document',
		options: [
			{
				displayName: 'Metadata Field',
				name: 'values',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						description: 'The key of the metadata to update',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'The value of the metadata to update',
					},
				],
			},
		],
	},
];
