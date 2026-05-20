import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';

import { toExecutionData } from '../utils';

export async function executeUpdate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;
	const name = this.getNodeParameter('name', itemIndex) as string;
	const metadata = this.getNodeParameter('metadata', itemIndex, {
		values: [],
	}) as IDataObject;
	const metadataValues = (metadata.values ?? []) as Array<{ key?: string; value?: string }>;
	const metadataBody = metadataValues.reduce<IDataObject>((acc, { key, value }) => {
		if (key) {
			acc[key] = value ?? '';
		}
		return acc;
	}, {});

	const body: IDataObject = { name };
	if (Object.keys(metadataBody).length > 0) {
		body.metadata = metadataBody;
	}

	const options: IHttpRequestOptions = {
		method: 'PATCH',
		url: `https://connect.omnifact.ai/v1/documents/${documentId}`,
		body,
		json: true,
	};

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'omnifactApi',
		options,
	);

	return toExecutionData.call(this, response as IDataObject, itemIndex);
}
