import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';

import { toExecutionData } from '../utils';

export async function executeGet(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;

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

	return toExecutionData.call(this, response as IDataObject, itemIndex);
}
