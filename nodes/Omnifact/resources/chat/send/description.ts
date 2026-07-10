import type { INodeProperties } from 'n8n-workflow';

export const sendDescription: INodeProperties[] = [
	{
		displayName: 'Endpoint ID',
		name: 'endpointId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 12345678-abcd-1234-abcd-123456789abc',
		description: 'The UUID of the Omnifact endpoint to send the message to',
		displayOptions: { show: { resource: ['chat'], operation: ['send'] } },
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
		description:
			'Messages to send to the chat endpoint. The last message must have the User role.',
		displayOptions: { show: { resource: ['chat'], operation: ['send'] } },
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
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		default: 'json',
		options: [
			{
				name: 'JSON',
				value: 'json',
				description: 'Return the raw API response (content, sources, token usage)',
			},
			{
				name: 'Markdown',
				value: 'markdown',
				description: 'Return content as text with source references appended as footnotes',
			},
		],
		description: 'How to format the output',
		displayOptions: { show: { resource: ['chat'], operation: ['send'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['chat'], operation: ['send'] } },
		options: [
			{
				displayName: 'Enable Agentic Workflow',
				name: 'enableAgenticWorkflow',
				type: 'boolean',
				default: false,
				description: 'Whether to enable adaptive tool selection for the response',
			},
			{
				displayName: 'Enable Inline Sources',
				name: 'enableInlineSources',
				type: 'boolean',
				default: false,
				description: 'Whether to enable inline source citations in the response content',
			},
		],
	},
];
