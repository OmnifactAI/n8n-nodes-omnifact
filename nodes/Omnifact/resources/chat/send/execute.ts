import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';

import type { OmnifactChatResponse, OmnifactDocumentPart, OmnifactInlineSource } from '../types';

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

export async function executeSend(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const endpointId = this.getNodeParameter('endpointId', itemIndex) as string;
	const message = this.getNodeParameter('message', itemIndex) as string;
	const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex) as IDataObject;

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
	const outputData = formatChatResponse(response, outputFormat);

	return this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(outputData), {
		itemData: { item: itemIndex },
	});
}

function formatChatResponse(response: OmnifactChatResponse, outputFormat: string): IDataObject {
	const hasInlineSources = !!(response.sources && response.sources.length > 0);

	if (outputFormat === 'markdown') {
		let text: string;
		if (hasInlineSources) {
			text = formatInlineSourcesAsMarkdown(response.content, response.sources);
		} else {
			text = formatDocumentPartsAsMarkdown(
				response.content,
				response.references?.documentParts ?? [],
			);
		}

		const outputData: IDataObject = { text };

		if (hasInlineSources) {
			outputData.sources = (response.sources ?? []).map((s) => ({
				documentName: s.documentName,
				page: s.page,
				documentId: s.documentId,
			})) as unknown as IDataObject[];
		} else if (response.references) {
			outputData.references = response.references;
		}
		if (
			response.references &&
			response.references.documentParts &&
			response.references.documentParts.length > 0
		) {
			outputData.documentParts = response.references.documentParts as unknown as IDataObject[];
		}

		return outputData;
	}

	const outputData: IDataObject = {
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
	if (
		response.references &&
		response.references.documentParts &&
		response.references.documentParts.length > 0
	) {
		outputData.documentParts = response.references.documentParts as unknown as IDataObject[];
	}

	return outputData;
}
