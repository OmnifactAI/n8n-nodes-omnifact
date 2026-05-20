import type { INodeProperties } from 'n8n-workflow';

import { sendDescription } from './send/description';

export const chatDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chat'] } },
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send a message',
				description: 'Send a message to an Omnifact chat endpoint',
			},
		],
		default: 'send',
	},
	...sendDescription,
];
