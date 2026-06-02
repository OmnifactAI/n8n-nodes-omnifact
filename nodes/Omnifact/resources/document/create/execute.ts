import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { MultipartRequestBody } from '../types';
import { toExecutionData } from '../utils';

export async function executeCreate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const spaceId = this.getNodeParameter('spaceId', itemIndex) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
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

	const items = this.getInputData();
	const itemBinaryData = items[itemIndex].binary;
	const availableFields = itemBinaryData ? Object.keys(itemBinaryData) : [];

	if (!itemBinaryData || !itemBinaryData[binaryPropertyName]) {
		throw new NodeOperationError(
			this.getNode(),
			`The item has no binary field "${binaryPropertyName}". ` +
				`Available binary fields: [${availableFields.join(', ')}]. ` +
				`Make sure a previous node (e.g. "Read Binary File" or "HTTP Request") ` +
				`outputs binary data with the field name "${binaryPropertyName}".`,
			{ itemIndex },
		);
	}

	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const dataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const fileName = (additionalFields.name as string) || binaryData.fileName || 'upload';
	const mimeType = binaryData.mimeType || 'application/octet-stream';

	// n8n's request type still references the legacy form-data package,
	// while Cloud-compatible nodes should use the platform FormData API.
	const formData = new FormData() as MultipartRequestBody;
	const file = new Blob([dataBuffer], { type: mimeType });
	formData.append('file', file, fileName);

	if (Object.keys(metadataBody).length > 0) {
		formData.append('metadata', JSON.stringify(metadataBody));
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
		const errorCode = (contextData?.code as string) ?? 'UploadFailed';
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
			throw new NodeOperationError(this.getNode(), `Document upload failed: ${detail}`, {
				itemIndex,
			});
		}
	}

	return toExecutionData.call(this, response, itemIndex);
}
