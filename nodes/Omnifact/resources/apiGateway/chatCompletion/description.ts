import type { INodeProperties } from 'n8n-workflow';

const chatCompletionDisplayOptions = {
	show: { resource: ['apiGateway'], operation: ['chatCompletion'] },
};

export const chatCompletionDescription: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'model',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. gpt-4o',
		description: 'The model identifier as returned by the List Models operation',
		displayOptions: chatCompletionDisplayOptions,
	},
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {
			values: [
				{
					role: 'user',
					content: '',
				},
			],
		},
		required: true,
		placeholder: 'Add Message',
		description: 'Messages to send to the model. The last message must have the User role.',
		displayOptions: chatCompletionDisplayOptions,
		options: [
			{
				displayName: 'Message',
				name: 'values',
				values: [
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						options: [
							{
								name: 'Assistant',
								value: 'assistant',
								description: 'Previous assistant response for multi-turn context',
							},
							{
								name: 'Developer',
								value: 'developer',
								description: 'Developer instructions for newer OpenAI reasoning models',
							},
							{
								name: 'System',
								value: 'system',
								description: "Instructions that set the assistant's behavior",
							},
							{
								name: 'User',
								value: 'user',
								description: 'Message from the end user',
							},
						],
						default: 'user',
						description: 'The role of the message author',
					},
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						required: true,
						default: '',
						typeOptions: { rows: 4 },
						description: 'The content of the message',
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		displayOptions: chatCompletionDisplayOptions,
		options: [
			{
				displayName: 'Max Completion Tokens',
				name: 'maxCompletionTokens',
				type: 'number',
				default: 256,
				typeOptions: { minValue: 1 },
				description: 'Maximum number of tokens to generate',
			},
			{
				displayName: 'Max Tokens',
				name: 'maxTokens',
				type: 'number',
				default: 256,
				typeOptions: { minValue: 1 },
				description: 'Legacy maximum number of tokens to generate',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 0, maxValue: 2 },
				description: 'Sampling temperature in the OpenAI-compatible range from 0 to 2',
			},
		],
	},
];
