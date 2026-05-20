import type { IExecuteFunctions, IHttpRequestOptions, INodeExecutionData } from 'n8n-workflow';

import { toExecutionData } from '../utils';

export async function executeDelete(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;

	const options: IHttpRequestOptions = {
		method: 'DELETE',
		url: `https://connect.omnifact.ai/v1/documents/${documentId}`,
		json: true,
	};

	await this.helpers.httpRequestWithAuthentication.call(this, 'omnifactApi', options);

	return toExecutionData.call(this, { deleted: true }, itemIndex);
}
