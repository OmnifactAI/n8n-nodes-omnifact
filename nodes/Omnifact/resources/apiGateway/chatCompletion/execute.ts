import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type ChatMessage = {
	role?: string;
	content?: string;
};

export async function executeChatCompletion(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', itemIndex) as string;
	const messagesCollection = this.getNodeParameter('messages', itemIndex, {
		values: [],
	}) as IDataObject;
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

	const messages = ((messagesCollection.values ?? []) as ChatMessage[]).map(({ role, content }) => ({
		role,
		content,
	}));

	if (messages.length === 0) {
		throw new NodeOperationError(this.getNode(), 'At least one message is required', {
			itemIndex,
		});
	}

	if (messages[messages.length - 1].role !== 'user') {
		throw new NodeOperationError(this.getNode(), 'The last message must have the User role', {
			itemIndex,
		});
	}

	const body: IDataObject = {
		model,
		messages: messages as unknown as IDataObject[],
		stream: false,
	};

	if (additionalFields.maxCompletionTokens !== undefined) {
		body.max_completion_tokens = additionalFields.maxCompletionTokens;
	}

	if (additionalFields.maxTokens !== undefined) {
		body.max_tokens = additionalFields.maxTokens;
	}

	if (additionalFields.temperature !== undefined) {
		body.temperature = additionalFields.temperature;
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: 'https://connect.omnifact.ai/v1/gateway/chat/completions',
		body,
		json: true,
	};

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'omnifactApi',
		options,
	)) as IDataObject;

	return this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(response), {
		itemData: { item: itemIndex },
	});
}
