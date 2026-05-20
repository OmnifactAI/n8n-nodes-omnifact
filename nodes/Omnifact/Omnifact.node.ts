import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { documentDescription } from './resources/document/index';

interface OmnifactInlineSource {
	documentId: string;
	documentName: string;
	page: number | null;
	sourceId: string;
	sourceType: string;
}

interface OmnifactDocumentPart {
	documentId: string;
	type: string;
	number: number;
}

type MultipartRequestBody = IHttpRequestOptions['body'] & FormData;

interface OmnifactChatResponse {
	id: string;
	content: string;
	references: IDataObject;
	documentParts: OmnifactDocumentPart[];
	sources: OmnifactInlineSource[];
	tokenUsage: { inputTokens: number; outputTokens: number };
}

export function formatInlineSourcesAsMarkdown(
	content: string,
	sources: OmnifactInlineSource[],
): string {
	if (!sources || sources.length === 0) {
		return content;
	}

	const footnotes = sources
		.map((s, i) => {
			const page = s.page ? `, p. ${s.page}` : '';
			return `[${i + 1}] ${s.documentName}${page}`;
		})
		.join('\n');

	return `${content}\n\n---\n**Sources:**\n${footnotes}`;
}

export function formatDocumentPartsAsMarkdown(
	content: string,
	documentParts: OmnifactDocumentPart[],
): string {
	if (!documentParts || documentParts.length === 0) {
		return content;
	}

	const footnotes = documentParts
		.map((dp, i) => {
			return `[${i + 1}] ${dp.documentId} (${dp.type} ${dp.number})`;
		})
		.join('\n');

	return `${content}\n\n---\n**Sources:**\n${footnotes}`;
}

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
				displayOptions: { show: { resource: ['document'] } },
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Chat', value: 'chat' },
					{ name: 'Document', value: 'document' },
				],
				default: 'chat',
			},
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
				displayName: 'Message',
				name: 'message',
				type: 'string',
				required: true,
				default: '',
				typeOptions: { rows: 4 },
				description: 'The message to send to the chat endpoint',
				displayOptions: { show: { resource: ['chat'], operation: ['send'] } },
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
						description:
							'Return content as text with source references appended as footnotes',
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
						description:
							'Whether to enable inline source citations in the response content',
					},
				],
			},
			...documentDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'chat' && operation === 'send') {
					const endpointId = this.getNodeParameter('endpointId', i) as string;
					const message = this.getNodeParameter('message', i) as string;
					const outputFormat = this.getNodeParameter('outputFormat', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					const headers: IDataObject = {};

					if (additionalFields.enableInlineSources) {
						headers['omnifact-enable-inline-sources'] = 'true';
					}

					if (additionalFields.enableAgenticWorkflow) {
						headers['omnifact-enable-agentic-workflow'] = 'true';
					}

					const options: IHttpRequestOptions = {
						method: 'POST',
						url: `https://connect.omnifact.ai/v1/endpoints/${endpointId}/chat`,
						headers,
						body: {
							messages: [{ content: message, role: 'user' }],
							streaming: false,
						},
						json: true,
					};

					const response = (await this.helpers.httpRequest(options)) as OmnifactChatResponse;

					let outputData: IDataObject;
					const hasInlineSources = !!(response.sources && response.sources.length > 0);

					if (outputFormat === 'markdown') {
						let text: string;
						if (hasInlineSources) {
							text = formatInlineSourcesAsMarkdown(response.content, response.sources);
						} else {
							text = formatDocumentPartsAsMarkdown(
								response.content,
								response.documentParts,
							);
						}

						outputData = { text };

						if (hasInlineSources) {
							outputData.sources = (response.sources ?? []).map((s) => ({
								documentName: s.documentName,
								page: s.page,
								documentId: s.documentId,
							})) as unknown as IDataObject[];
						} else if (response.references) {
							outputData.references = response.references;
						}
						if (response.documentParts && response.documentParts.length > 0) {
							outputData.documentParts =
								response.documentParts as unknown as IDataObject[];
						}
					} else {
						outputData = {
							id: response.id,
							content: response.content,
							tokenUsage: response.tokenUsage as unknown as IDataObject,
						};

						if (hasInlineSources) {
							outputData.sources = response.sources as unknown as IDataObject[];
						}
						if (response.references) {
							outputData.references = response.references;
						}
						if (response.documentParts && response.documentParts.length > 0) {
							outputData.documentParts =
								response.documentParts as unknown as IDataObject[];
						}
					}

					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(outputData),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				} else if (resource === 'document') {
					if (operation === 'create') {
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						const binaryPropertyName = this.getNodeParameter(
							'binaryPropertyName',
							i,
						) as string;
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
						) as IDataObject;

						const itemBinaryData = items[i].binary;
						const availableFields = itemBinaryData
							? Object.keys(itemBinaryData)
							: [];

						if (!itemBinaryData || !itemBinaryData[binaryPropertyName]) {
							throw new NodeOperationError(
								this.getNode(),
								`The item has no binary field "${binaryPropertyName}". ` +
								`Available binary fields: [${availableFields.join(', ')}]. ` +
								`Make sure a previous node (e.g. "Read Binary File" or "HTTP Request") ` +
								`outputs binary data with the field name "${binaryPropertyName}".`,
								{ itemIndex: i },
							);
						}

						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const dataBuffer = await this.helpers.getBinaryDataBuffer(
							i,
							binaryPropertyName,
						);

						const fileName =
							(additionalFields.name as string) || binaryData.fileName || 'upload';
						const mimeType = binaryData.mimeType || 'application/octet-stream';

						// n8n's request type still references the legacy form-data package,
						// while Cloud-compatible nodes should use the platform FormData API.
						const formData = new FormData() as MultipartRequestBody;
						const file = new Blob([dataBuffer], { type: mimeType });
						formData.append('file', file, fileName);

						if (additionalFields.metadata) {
							formData.append(
								'metadata',
								typeof additionalFields.metadata === 'string'
									? additionalFields.metadata
									: JSON.stringify(additionalFields.metadata),
							);
						}

						const options: IHttpRequestOptions = {
							method: 'POST',
							url: `https://connect.omnifact.ai/v1/documents?spaceId=${spaceId}`,
							body: formData,
							json: true,
						};

						let response: IDataObject;
						try {
							response = (await this.helpers.httpRequestWithAuthentication.call(
								this,
								'omnifactApi',
								options,
							)) as IDataObject;
						} catch (uploadError) {
							const errObj = uploadError as Record<string, unknown>;
							const context = errObj.context as Record<string, unknown> | undefined;
							const contextData = context?.data as Record<string, unknown> | undefined;
							const errorCode =
								(contextData?.code as string) ?? 'UploadFailed';
							const detail =
								(contextData?.message as string) ??
								(errObj.description as string) ??
								(uploadError as Error).message;

							if (this.continueOnFail()) {
								response = {
									name: fileName,
									spaceId,
									error: errorCode,
									errorMessage: detail,
								};
							} else {
								throw new NodeOperationError(
									this.getNode(),
									`Document upload failed: ${detail}`,
									{ itemIndex: i },
								);
							}
						}
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(response),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else if (operation === 'delete') {
						const documentId = this.getNodeParameter('documentId', i) as string;

						const options: IHttpRequestOptions = {
							method: 'DELETE',
							url: `https://connect.omnifact.ai/v1/documents/${documentId}`,
							json: true,
						};

						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'omnifactApi',
							options,
						);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({ deleted: true }),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else if (operation === 'get') {
						const documentId = this.getNodeParameter('documentId', i) as string;

						const options: IHttpRequestOptions = {
							method: 'GET',
							url: `https://connect.omnifact.ai/v1/documents/${documentId}`,
							json: true,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'omnifactApi',
							options,
						);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(response as IDataObject),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else if (operation === 'getAll') {
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll
							? 0
							: (this.getNodeParameter('limit', i) as number);

						const results: IDataObject[] = [];
						let offset = 0;
						const pageSize = 100;
						let hasMore = true;

						while (hasMore) {
							const options: IHttpRequestOptions = {
								method: 'GET',
								url: `https://connect.omnifact.ai/v1/documents?spaceId=${spaceId}&offset=${offset}&limit=${pageSize}`,
								json: true,
							};

							const response = (await this.helpers.httpRequestWithAuthentication.call(
								this,
								'omnifactApi',
								options,
							)) as IDataObject;

							const items = (response.items ?? []) as IDataObject[];
							const total = (response.total ?? 0) as number;

							if (items.length === 0) {
								break;
							}

							results.push(...items);
							offset += items.length;

							if (!returnAll && results.length >= limit) {
								hasMore = false;
							} else if (offset >= total) {
								hasMore = false;
							}
						}

						const finalResults = !returnAll && limit > 0
							? results.slice(0, limit)
							: results;

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(finalResults),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else if (operation === 'update') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const name = this.getNodeParameter('name', i) as string;

						const options: IHttpRequestOptions = {
							method: 'PATCH',
							url: `https://connect.omnifact.ai/v1/documents/${documentId}`,
							body: { name },
							json: true,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'omnifactApi',
							options,
						);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(response as IDataObject),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					}
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
