import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';

export async function executeModels(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const options: IHttpRequestOptions = {
		method: 'GET',
		url: 'https://connect.omnifact.ai/v1/gateway/models',
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
