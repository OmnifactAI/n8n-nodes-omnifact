import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { executeCreate } from './create/execute';
import { executeDelete } from './delete/execute';
import { executeGet } from './get/execute';
import { executeGetAll } from './getAll/execute';
import { executeUpdate } from './update/execute';

export async function executeDocumentOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'create') {
		return executeCreate.call(this, itemIndex);
	}
	if (operation === 'delete') {
		return executeDelete.call(this, itemIndex);
	}
	if (operation === 'get') {
		return executeGet.call(this, itemIndex);
	}
	if (operation === 'getAll') {
		return executeGetAll.call(this, itemIndex);
	}
	if (operation === 'update') {
		return executeUpdate.call(this, itemIndex);
	}

	throw new NodeOperationError(this.getNode(), `Unsupported document operation "${operation}"`, {
		itemIndex,
	});
}
