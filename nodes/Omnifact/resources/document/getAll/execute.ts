import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';

import { toExecutionData } from '../utils';

export async function executeGetAll(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const spaceId = this.getNodeParameter('spaceId', itemIndex) as string;
	const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', itemIndex) as number);

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

	const finalResults = !returnAll && limit > 0 ? results.slice(0, limit) : results;

	return toExecutionData.call(this, finalResults, itemIndex);
}
