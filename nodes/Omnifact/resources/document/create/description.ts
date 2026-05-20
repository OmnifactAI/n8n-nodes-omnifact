import type { INodeProperties } from 'n8n-workflow';

export const createDescription: INodeProperties[] = [
	{
		displayName: 'Space ID',
		name: 'spaceId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345678-abcd-1234-abcd-123456789abc',
		description: 'The UUID of the space to upload the document to',
		displayOptions: { show: { resource: ['document'], operation: ['create'] } },
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		description: 'The name of the input binary field containing the file to upload',
		displayOptions: { show: { resource: ['document'], operation: ['create'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['document'], operation: ['create'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Override the filename of the uploaded document',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Additional metadata to attach to the document as JSON',
			},
		],
	},
];
