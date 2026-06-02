import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { executeApiGatewayOperation } from './resources/apiGateway/execute';
import { apiGatewayDescription } from './resources/apiGateway/index';
import {
	executeChatOperation,
	formatDocumentPartsAsMarkdown,
	formatInlineSourcesAsMarkdown,
} from './resources/chat/execute';
import { chatDescription } from './resources/chat/index';
import { executeDocumentOperation } from './resources/document/execute';
import { documentDescription } from './resources/document/index';

export { formatDocumentPartsAsMarkdown, formatInlineSourcesAsMarkdown };

export class Omnifact implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Omnifact',
		name: 'omnifact',
		icon: { light: 'file:omnifact.svg', dark: 'file:omnifact.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Omnifact API',
		defaults: { name: 'Omnifact' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'omnifactApi',
				required: true,
				displayOptions: { show: { resource: ['apiGateway', 'document'] } },
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'API Gateway', value: 'apiGateway' },
					{ name: 'Chat', value: 'chat' },
					{ name: 'Document', value: 'document' },
				],
				default: 'chat',
			},
			...apiGatewayDescription,
			...chatDescription,
			...documentDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'apiGateway') {
					returnData.push(...(await executeApiGatewayOperation.call(this, operation, i)));
				} else if (resource === 'chat') {
					returnData.push(...(await executeChatOperation.call(this, operation, i)));
				} else if (resource === 'document') {
					returnData.push(...(await executeDocumentOperation.call(this, operation, i)));
				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported resource "${resource}"`, {
						itemIndex: i,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
