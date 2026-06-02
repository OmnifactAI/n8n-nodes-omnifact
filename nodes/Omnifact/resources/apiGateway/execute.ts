import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { executeChatCompletion } from './chatCompletion/execute';
import { executeModels } from './models/execute';

export async function executeApiGatewayOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	if (operation === 'chatCompletion') {
		return executeChatCompletion.call(this, itemIndex);
	}
	if (operation === 'models') {
		return executeModels.call(this, itemIndex);
	}

	throw new NodeOperationError(this.getNode(), `Unsupported API Gateway operation "${operation}"`, {
		itemIndex,
	});
}
