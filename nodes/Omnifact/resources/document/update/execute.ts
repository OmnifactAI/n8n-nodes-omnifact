import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toExecutionData } from '../utils';

export async function executeUpdate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const documentId = this.getNodeParameter('documentId', itemIndex) as string;
	const name = this.getNodeParameter('name', itemIndex, '') as string;
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

	const body: IDataObject = {};
	if (name.trim()) {
		body.name = name;
	}
	if (Object.keys(metadataBody).length > 0) {
		body.metadata = metadataBody;
	}

	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Provide a name or at least one metadata field to update the document.',
			{ itemIndex },
		);
	}

	const options: IHttpRequestOptions = {
		method: 'PATCH',
		url: `https://connect.omnifact.ai/v1/documents/${documentId}`,
		body,
		json: true,
	};

	let response: IDataObject;
	try {
		response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'omnifactApi',
			options,
		)) as IDataObject;
	} catch (updateError) {
		const errObj = updateError as Record<string, unknown>;
		const context = errObj.context as Record<string, unknown> | undefined;
		const contextData = context?.data as Record<string, unknown> | undefined;
		const errorCode = (contextData?.code as string) ?? 'UpdateFailed';
		const detail =
			(contextData?.message as string) ??
			(errObj.description as string) ??
			(updateError as Error).message;

		if (this.continueOnFail()) {
			response = {
				documentId,
				error: errorCode,
				errorMessage: detail,
			};
		} else {
			throw new NodeOperationError(this.getNode(), `Document update failed: ${detail}`, {
				itemIndex,
			});
		}
	}

	return toExecutionData.call(this, response, itemIndex);
}
