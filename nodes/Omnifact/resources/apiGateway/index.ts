import type { INodeProperties } from 'n8n-workflow';

import { chatCompletionDescription } from './chatCompletion/description';
import { modelsDescription } from './models/description';

export const apiGatewayDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['apiGateway'] } },
		options: [
			{
				name: 'Create Chat Completion',
				value: 'chatCompletion',
				action: 'Create an API gateway chat completion',
				description: 'Create an OpenAI-compatible chat completion',
			},
			{
				name: 'List Models',
				value: 'models',
				action: 'List API gateway models',
				description: 'List enabled OpenAI-compatible models',
			},
		],
		default: 'models',
	},
	...modelsDescription,
	...chatCompletionDescription,
];
