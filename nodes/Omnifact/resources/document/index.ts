import type { INodeProperties } from 'n8n-workflow';

import { createDescription } from './create/description';
import { deleteDescription } from './delete/description';
import { getDescription } from './get/description';
import { getAllDescription } from './getAll/description';
import { updateDescription } from './update/description';

export const documentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['document'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a document',
				description: 'Upload a new document to a space',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a document',
				description: 'Delete a document by ID',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a document',
				description: 'Retrieve a document by ID',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many documents',
				description: 'Retrieve multiple documents from a space',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a document',
				description: 'Update a document name',
			},
		],
		default: 'get',
	},
	...createDescription,
	...deleteDescription,
	...getDescription,
	...getAllDescription,
	...updateDescription,
];
