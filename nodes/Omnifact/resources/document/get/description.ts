import type { INodeProperties } from 'n8n-workflow';

export const getDescription: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345678-abcd-1234-abcd-123456789abc',
		description: 'The UUID of the document to retrieve',
		displayOptions: { show: { resource: ['document'], operation: ['get'] } },
	},
];
